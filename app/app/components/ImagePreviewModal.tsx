import React, { useEffect } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';



interface ImagePreviewModalProps {
  imageUri: string | null;
  onClose: () => void;
}


export function ImagePreviewModal({ imageUri, onClose }: ImagePreviewModalProps) {
  useEffect(() => {
      // console.log('open')
    }, []);
  if (!imageUri) return null;

  return (
    <Modal visible={!!imageUri} transparent animationType="fade">
      <View className="flex-1 bg-black/90 justify-center items-center">
        <Pressable
          className="absolute inset-0"
          onPress={onClose} 
        />
        <Pressable
          onPress={onClose}
          className="absolute top-5 right-5 z-10 p-2"
          hitSlop={10} 
        >
          <Text className="text-white text-3xl font-bold">×</Text>
        </Pressable>

        {/* Image container */}
        <View className="w-11/12 h-[75%] justify-center items-center">
          <Image
            source={{ uri: imageUri }}
            className="w-full h-full rounded-lg"
            resizeMode="contain"
          />
        </View>
      </View>
    </Modal>
  );
}

// How to
// const [previewImage, setPreviewImage] = useState<string | null>(null);

// <TouchableOpacity onPress={() => setPreviewImage(item)}></TouchableOpacity>

// <ImagePreviewModal imageUri={previewImage} onClose={() => setPreviewImage(null)}/>
