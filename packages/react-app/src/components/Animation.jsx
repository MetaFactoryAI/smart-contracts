import React, { Suspense } from "react";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

function Model(props) {
  const { scene } = useGLTF(props.url);
  return <primitive object={scene} />;
}

function Animation(props) {
  return (
    <div style={{ height: "100vh", backgroundColor: "#fde2e4" }}>
      <Canvas camera={{ position: [10, 18, 23], fov: 0.5 }}>
        <pointLight position={[10, 10, 10]} intensity={1.3} />
        <Suspense fallback={null}>
          <Model url={props.animationUrl} />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default Animation;
