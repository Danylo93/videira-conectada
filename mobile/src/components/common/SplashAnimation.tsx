import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface SplashAnimationProps {
  onAnimationFinish?: () => void; // Propriedade opcional
}

const SplashAnimation: React.FC<SplashAnimationProps> = ({ onAnimationFinish }) => {
  useEffect(() => {
    if (onAnimationFinish) {
      // O evento onAnimationFinish da LottieView é chamado quando a animação termina
      const animationFinishHandler = () => {
        onAnimationFinish();
      };

      // LottieView não expõe diretamente a maneira de saber quando a animação termina, então vamos chamar a função de retorno diretamente.
      setTimeout(animationFinishHandler, 3000); // Assume que a animação dura 3 segundos
    }
  }, [onAnimationFinish]);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/splash-animation.json')} // arquivo JSON da animação
        autoPlay
        loop={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default SplashAnimation;
