// Model.jsx
import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';

export function Model(props) {
  const group = useRef();
  // Load the new avatar model
  const { nodes, materials, animations } = useGLTF('/new-avatar.glb'); // <-- Change path here
  const { actions } = useAnimations(animations, group);

  // Handle animations based on the animationName prop
  const handleAnimation = (animationName) => {
    const from = animationName === 'talk' ? 'Armature|TalkLayer' : 'Armature|IdleLayer'; // Adjust animation names
    const to = animationName === 'talk' ? 'Armature|IdleLayer' : 'Armature|TalkLayer';
    if (actions[from].isRunning()) {
      actions[from].fadeOut(0.3);
    }
    actions[to].reset().fadeIn(0.3).play();
  };

  useEffect(() => {
    handleAnimation(props.animationName);
  }, [props.animationName]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Armature">
          <primitive object={nodes.Hips} />
          <skinnedMesh
            name="Body"
            geometry={nodes.Body.geometry}
            material={materials['Body_Material']}
            skeleton={nodes.Body.skeleton}
          />
        </group>
      </group>
    </group>
  );
}

// Ensure to preload the GLTF model
useGLTF.preload('/new-avatar.glb');
