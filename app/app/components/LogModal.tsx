// components/LogModal.tsx
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LogModal({ point, onClose, onSave }) {
  const [note, setNote] = useState('');
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  return (
    <Modal transparent animationType="slide">
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white rounded-2xl p-6 w-11/12">
          <Text className="text-lg font-bold mb-4">
            {point.type === 'pickup' ? 'บันทึกรับของ' : 'บันทึกส่งของ'}
          </Text>

          <Text className="text-sm text-gray-700 mb-2">หมายเหตุ</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-2 mb-4"
            placeholder="พิมพ์รายละเอียด..."
            multiline
            value={note}
            onChangeText={setNote}
          />

          <TouchableOpacity className="bg-gray-200 p-3 rounded-xl mb-3" onPress={pickImage}>
            <Text className="text-center">{image ? 'เปลี่ยนรูป' : 'ถ่ายรูปแนบ'}</Text>
          </TouchableOpacity>
          {image && <Image source={{ uri: image }} className="h-32 w-full mb-4 rounded-lg" />}

          <View className="flex-row justify-between">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-red-500 font-semibold">ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-blue-500 px-4 py-2 rounded-xl"
              onPress={() => {
                onSave({ note, image });
              }}
            >
              <Text className="text-white">บันทึก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
