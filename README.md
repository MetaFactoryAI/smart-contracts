# :robot: Wearable NFT claims
MetaFactory repo for wearable smartcontracts and claims.
It leverages:
- Scaffold-eth
- The Sandbox Game's MultiGiveaway contract
- Manifold's base NFT structure, see https://github.com/manifoldxyz/creator-core-solidity 

## Dev quickstart
Local dev full-stack quickstart:
```yarn chain```
```yarn start```
```yarn deploy```
```yarn remove-graph-node``` ```yarn run-graph-node```
```yarn graph-codegen```
```yarn graph-build```
```yarn graph-create-local```
```yarn graph-deploy-local```
```yarn mint```

## About Scaffold-eth
Scaffold-eth provides an out-of-the-shelf stack for rapid prototyping on Ethereum, giving developers access to state-of-the-art tools to quickly learn and ship an Ethereum-based dApp. 

## The Scaffold-eth stack
Scaffold-eth is not a product itself but more of a combination or stack of other great products. It allows you to quickly build and iterate over your smart contracts and frontends. It leverages:

- Hardhat for running local networks, deploying and testing smart contracts.
- React for building a frontend, using many useful pre-made components and hooks.
- Ant for your UI. But can be easily changed to Bootstrap or some other library you prefer.
- Surge for publishing your app.
- Tenderly / The Graph / Etherscan / Infura / Blocknative and more!
- Support for L2 / Sidechains like Optimism and Arbitrum.
