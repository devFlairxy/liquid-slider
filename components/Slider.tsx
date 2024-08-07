import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import Wave, { HEIGHT, MARGIN_WIDTH, MIN_LEDGE, Side, WIDTH } from './Wave';
import Button from './Button';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { snapPoint, useVector } from 'react-native-redash';

const PREV = WIDTH;
const NEXT = 0;

interface SliderProps {
  index: number;
  setIndex: (value: number) => void;
  children: JSX.Element;
  prev?: JSX.Element;
  next?: JSX.Element;
}

const Slider = ({
  index,
  children: current,
  prev,
  next,
  setIndex,
}: SliderProps) => {
  const hasPrev = !!prev;
  const hasNext = !!next;
  const activeSide = useSharedValue(Side.NONE);
  const isTransitioningLeft = useSharedValue(false);
  const isTransitioningRight = useSharedValue(false);
  const left = useVector(0, HEIGHT / 2);
  const right = useVector(0, HEIGHT);

  const panGesture = Gesture.Pan()
    .onStart(({ x }) => {
      if (x <= MARGIN_WIDTH) {
        activeSide.value = Side.LEFT;
      } else if (x >= WIDTH - MARGIN_WIDTH) {
        activeSide.value = Side.RIGHT;
      } else {
        activeSide.value = Side.NONE;
      }
    })
    .onUpdate(({ x, y }) => {
      if (activeSide.value === Side.LEFT) {
        left.x.value = Math.max(x, MARGIN_WIDTH);
        left.y.value = y;
      } else if (activeSide.value === Side.RIGHT) {
        right.x.value = Math.max(WIDTH - x, MARGIN_WIDTH);
        right.y.value = y;
      }
    })
    .onFinalize(({ x, velocityX, velocityY }) => {
      if (activeSide.value === Side.LEFT) {
        const snapPoints = [MIN_LEDGE, WIDTH];
        const dest = snapPoint(x, velocityX, snapPoints);
        isTransitioningLeft.value = dest === WIDTH;
        left.x.value = withSpring(
          dest,
          {
            velocity: velocityX,
            overshootClamping: isTransitioningLeft.value,
            restSpeedThreshold: isTransitioningLeft.value ? 100 : 0.01,
            restDisplacementThreshold: isTransitioningLeft.value ? 100 : 0.01,
          },
          () => {
            if (isTransitioningLeft.value) {
              runOnJS(setIndex)(index - 1);
            }
          }
        );
        left.y.value = withSpring(HEIGHT / 2, { velocity: velocityY });
      } else if (activeSide.value === Side.RIGHT) {
        const snapPoints = [WIDTH - MIN_LEDGE, 0];
        const dest = snapPoint(x, velocityX, snapPoints);
        isTransitioningRight.value = dest === 0;
        right.x.value = withSpring(
          WIDTH - dest,
          {
            velocity: velocityX,
            overshootClamping: isTransitioningRight.value,
            restSpeedThreshold: isTransitioningRight.value ? 100 : 0.01,
            restDisplacementThreshold: isTransitioningRight.value ? 100 : 0.01,
          },
          () => {
            if (isTransitioningRight.value) {
              runOnJS(setIndex)(index + 1);
            }
          }
        );
        right.y.value = withSpring(HEIGHT / 2, { velocity: velocityY });
      }
    });

  const leftStyle = useAnimatedStyle(() => ({
    zIndex: activeSide.value === Side.LEFT ? 100 : 0,
  }));

  useEffect(() => {
    left.x.value = withSpring(MIN_LEDGE);
    right.x.value = withSpring(MIN_LEDGE);
  }, []);

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={StyleSheet.absoluteFill}>
          {current}
          {prev && (
            <Animated.View style={[StyleSheet.absoluteFill, leftStyle]}>
              <Wave
                side={Side.LEFT}
                position={left}
                isTransitioning={isTransitioningLeft}
              >
                {prev}
              </Wave>
            </Animated.View>
          )}
          {next && (
            <Animated.View style={StyleSheet.absoluteFill}>
              <Wave
                side={Side.RIGHT}
                position={right}
                isTransitioning={isTransitioningLeft}
              >
                {next}
              </Wave>
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default Slider;
