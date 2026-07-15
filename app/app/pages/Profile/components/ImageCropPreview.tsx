import React, { useRef, useState } from "react";
import { Animated, Dimensions, PanResponder, View } from "react-native";

const { width, height } = Dimensions.get("window");

export const ImageCropPreview = ({ uri }: { uri: string | null }) => {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;

  const [lastOffset, setLastOffset] = useState({ x: 0, y: 0 });
  const [lastScale, setLastScale] = useState(1);
  const [pinchDistance, setPinchDistance] = useState(0);

  // ✅ สร้าง gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.numberActiveTouches === 1 || gesture.numberActiveTouches === 2,

      onPanResponderMove: (_, gesture) => {
        if (gesture.numberActiveTouches === 1) {
          // ลากรูป
          Animated.event(
            [{ dx: pan.x, dy: pan.y }],
            { useNativeDriver: false }
          )(_, gesture);
        } else if (gesture.numberActiveTouches === 2) {
          // pinch zoom
          const touches = (gesture as any).touches;
          if (touches?.length === 2) {
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (pinchDistance === 0) {
              setPinchDistance(distance);
            } else {
              const scaleFactor = (distance / pinchDistance) * lastScale;
              scale.setValue(Math.min(Math.max(scaleFactor, 0.7), 3)); // จำกัดซูม
            }
          }
        }
      },

      onPanResponderRelease: (_, gesture) => {
        setLastOffset({
          x: lastOffset.x + gesture.dx,
          y: lastOffset.y + gesture.dy,
        });
        setPinchDistance(0);
        setLastScale(scale.__getValue());
      },
    })
  ).current;

  return (
    <View className="flex-1 bg-black justify-center items-center overflow-hidden">
      {uri && (
        <Animated.Image
          source={{ uri }}
          style={{
            width,
            height,
            transform: [
              { translateX: Animated.add(pan.x, new Animated.Value(lastOffset.x)) },
              { translateY: Animated.add(pan.y, new Animated.Value(lastOffset.y)) },
              { scale: scale },
            ],
          }}
          resizeMode="contain"
          {...panResponder.panHandlers}
        />
      )}

      {/* ✅ วงกลม mask */}
      <View
        style={{
          position: "absolute",
          width,
          height,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: height / 2 - 150,
            left: width / 2 - 150,
            width: 300,
            height: 300,
            borderRadius: 150,
            borderWidth: 2,
            borderColor: "white",
            backgroundColor: "transparent",
          }}
        />
      </View>
    </View>
  );
};
