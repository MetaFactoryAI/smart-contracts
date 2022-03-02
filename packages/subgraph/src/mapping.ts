import { store, Address, Bytes, BigInt } from "@graphprotocol/graph-ts";
import { TransferSingle, TransferBatch, WearableToken as WearableTokenContract } from "../generated/MFW/WearableToken"; // TODO: contract import
import { WearableToken, WearableCollection, Owner, All } from "../generated/schema";

import { log } from "@graphprotocol/graph-ts";

import { WearableTokenOwned } from "../generated/schema";

let ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

let ONE = BigInt.fromI32(1);
let ZERO = BigInt.fromI32(0);

export function handleTransferBatch(event: TransferBatch): void {
  let values = event.params.values;
  let ids = event.params.ids;
  for (let i = 0; i < event.params.ids.length; i++) {
    handleTransfer(event.block.timestamp, event.address, event.params.from, event.params.to, ids[i], values[i]);
  }
}

export function handleTransferSingle(event: TransferSingle): void {
  let tokenId = event.params.id;
  handleTransfer(event.block.timestamp, event.address, event.params.from, event.params.to, tokenId, event.params.value);
}

function handleTransfer(
  timestamp: BigInt,
  contractAddress: Address,
  fromAddress: Bytes,
  toAddress: Bytes,
  tokenId: BigInt,
  quantity: BigInt
): void {
  let id = tokenId.toString();
  let from = fromAddress.toHex();
  let to = toAddress.toHex();
  let contract = WearableTokenContract.bind(contractAddress);

  // ---------------------------------------------------------------------------------------------------------------
  // - STATS SETUP
  // ---------------------------------------------------------------------------------------------------------------
  let all = All.load('all');
  if (all == null) {
    all = new All('all');
    all.numWearables = ZERO;
    all.numWearableCollections = ZERO;
    all.numWearableOwners = ZERO;
  }
  all.lastUpdate = timestamp;

  // ---------------------------------------------------------------------------------------------------------------
  // - TOKEN SETUP
  // ---------------------------------------------------------------------------------------------------------------
  let collection: WearableCollection | null;
  let wearableToken = WearableToken.load(id);
  if (wearableToken == null) {
    let collectionId: BigInt;
    let owner: string = null;
    // TODO:
    // let ownerCall = contract.try_ownerOf(tokenId);
    // if (!ownerCall.reverted) {
    //   owner = ownerCall.value.toHex();
    // }
    if (owner != null) {
      // TODO:
      // let collectionIdCall = contract.try_collectionOf(tokenId);
      // if (!collectionIdCall.reverted) {
      //   collectionId = collectionIdCall.value;
      // } else {
      //   collectionId = tokenId; 
      // }
    } else {
      collectionId = tokenId;
    }

    wearableToken = new WearableToken(id);
    wearableToken.timestamp = timestamp;
    wearableToken.supply = ZERO;
    wearableToken.collection = collectionId.toString();

    collection = WearableCollection.load(wearableToken.collection);
    if (collection == null) {
      collection = new WearableCollection(wearableToken.collection);
      collection.numTokenTypes = ZERO;
      let metadataURI = contract.try_uri(collectionId);
      if (!metadataURI.reverted) {
        collection.tokenURI = metadataURI.value;
      } else {
        log.error("error tokenURI from {id} {collectionId}", [id, collectionId.toString()]);
        collection.tokenURI = "error"; // SHOULD NEVER REACH THERE
      }
      collection.timestamp = timestamp;
      collection.supply = ZERO;

      all.numWearableCollections = all.numWearableCollections.plus(ONE);
    }

    collection.numTokenTypes = collection.numTokenTypes.plus(ONE);
  } else {
    collection = WearableCollection.load(wearableToken.collection);
  }

  // ---------------------------------------------------------------------------------------------------------------
  // - FROM OTHER ACCOUNTS : TRANSFER OR BURN
  // ---------------------------------------------------------------------------------------------------------------
  if (from != ADDRESS_ZERO) {
    let currentOwner = Owner.load(from);
    if (currentOwner != null) {
      currentOwner.numWearables = currentOwner.numWearables.minus(quantity);
      if (currentOwner.numWearables.equals(ZERO)) {
        all.numWearableOwners = all.numWearableOwners.minus(ONE);
      }

      let wearableTokenOwned: WearableTokenOwned | null;
      wearableTokenOwned = WearableTokenOwned.load(from + '_' + id);
      if (wearableTokenOwned != null) {
        wearableTokenOwned.quantity = wearableTokenOwned.quantity.minus(quantity);
        if (wearableTokenOwned.quantity.le(ZERO)) {
          store.remove("wearableTokenOwned", wearableTokenOwned.id);
        } else {
          wearableTokenOwned.save();
        }
      }
      currentOwner.save();
    } else {
      log.error("error from non existing owner {from} {id}", [from, id]);
    }
    collection.supply = collection.supply.minus(quantity);
    wearableToken.supply = wearableToken.supply.minus(quantity);
    all.numWearables = all.numWearables.minus(quantity);
  }


  // ---------------------------------------------------------------------------------------------------------------
  // - TO OTHER ACCOUNTS : TRANSFER OR MINT
  // ---------------------------------------------------------------------------------------------------------------
  if (to != ADDRESS_ZERO) {

    let newOwner = Owner.load(to);
    if (newOwner == null) {
      newOwner = new Owner(to);
      newOwner.timestamp = timestamp;
      newOwner.numWearables = ZERO;
    }

    collection.supply = collection.supply.plus(quantity);
    wearableToken.supply = wearableToken.supply.plus(quantity);
    all.numWearables = all.numWearables.plus(quantity);

    let wearableTokenOwned: WearableTokenOwned | null;
    wearableTokenOwned = WearableTokenOwned.load(to + '_' + id);
    if (wearableTokenOwned == null) {
      wearableTokenOwned = new WearableTokenOwned(to + '_' + id);
      wearableTokenOwned.owner = newOwner.id;
      wearableTokenOwned.token = id;
      wearableTokenOwned.quantity = ZERO;
    }
    wearableTokenOwned.quantity = wearableTokenOwned.quantity.plus(quantity);
    wearableTokenOwned.save();

    newOwner.numWearables = newOwner.numWearables.plus(quantity);
    if (newOwner.numWearables.equals(quantity)) {
      all.numWearableOwners = all.numWearableOwners.plus(ONE);
    }
    newOwner.save();
  } else {
    // ---------------------------------------------------------------------------------------------------------------
    // - TO ZERO ADDRESS: BURN (or void ?)
    // ---------------------------------------------------------------------------------------------------------------
  }

  collection.save();
  wearableToken.save();
  all.save();
}
