import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

const GlobeModel = () => {
    const sphereRef = useRef();
    const dotsRef = useRef();
    const satelliteRef = useRef();

    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime();
        if (sphereRef.current) {
            sphereRef.current.rotation.y += delta * 0.2;
        }
        if (dotsRef.current) {
            dotsRef.current.rotation.y += delta * 0.25;
        }
        if (satelliteRef.current) {
            // Orbit calculation
            satelliteRef.current.position.x = Math.cos(time * 0.5) * 2.5;
            satelliteRef.current.position.z = Math.sin(time * 0.5) * 2.5;
            satelliteRef.current.position.y = Math.sin(time * 0.3) * 0.5;
        }
    });

    return (
        <group scale={1.2}>
            {/* Core Sphere */}
            <mesh ref={sphereRef}>
                <sphereGeometry args={[1.5, 64, 64]} />
                <meshStandardMaterial
                    color="#020617"
                    roughness={0.1}
                    metalness={0.8}
                    emissive="#1e40af"
                    emissiveIntensity={0.2}
                />
            </mesh>

            {/* Glowing Atmosphere Layer */}
            <Sphere args={[1.52, 64, 64]}>
                <meshStandardMaterial
                    color="#3b82f6"
                    transparent
                    opacity={0.15}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </Sphere>

            {/* Stylized "Data" Layer (Representation of Continents) */}
            <mesh ref={dotsRef}>
                <sphereGeometry args={[1.55, 32, 32]} />
                <meshPhongMaterial
                    color="#60a5fa"
                    wireframe
                    transparent
                    opacity={0.3}
                    emissive="#3b82f6"
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Floating Subtle Ring */}
            <mesh rotation={[Math.PI / 2, 0.2, 0]}>
                <torusGeometry args={[2.2, 0.005, 16, 100]} />
                <meshStandardMaterial color="#3b82f6" transparent opacity={0.2} emissive="#3b82f6" />
            </mesh>
        </group>
    );
};

const WorldGlobe = () => {
    return (
        <div className="relative w-full aspect-square flex items-center justify-center overflow-visible">
            {/* Outer Atmospheric Glow (CSS fallback for depth) */}
            <div className="absolute inset-0 bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="relative w-full h-full z-10"
            >
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
                    <pointLight position={[-10, -10, -5]} intensity={1} color="#3b82f6" />
                    <Environment preset="city" />
                    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                        <GlobeModel />
                    </Float>
                </Canvas>
            </motion.div>
        </div>
    );
};

export default WorldGlobe;
