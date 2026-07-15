import React from "react"
import { Modal, Text, TouchableOpacity, View } from "react-native"

type AlertModalProps = {
  visible: boolean
  message: string
  message2: string
  onClose: () => void
}

interface ConfirmModalProps {
  visible: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function AlertModal({ visible, message, message2, onClose }: AlertModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-6 rounded-2xl w-80 shadow-lg">
          <Text className="text-lg font-semibold text-center mb-4">{message}</Text>
          <Text className="text-center text-base text-gray-700 mb-4">{message2}</Text>
          <TouchableOpacity onPress={onClose} className="bg-blue-500 py-2 rounded-xl">
            <Text className="text-center text-white font-medium">OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export function ConfirmModal({ visible, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white rounded-lg p-5 w-80">
          <Text className="text-lg font-medium mb-4">{message}</Text>

          <View className="flex-row justify-end gap-x-2">
            <TouchableOpacity onPress={onCancel} className="bg-gray-300 px-4 py-2 rounded-lg">
              <Text className="text-gray-800 font-medium">ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} className="bg-blue-500 px-4 py-2 rounded-lg">
              <Text className="text-white font-medium">ยืนยัน</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// How to
// const [confirmVisible, setConfirmVisible] = useState(false);

// const handleSaveWithConfirm = () => {
//   setConfirmVisible(true);
// };
// const handleConfirm = () => {
//   setConfirmVisible(false);
//   handleSave(); // เรียกฟังก์ชันบันทึกจริง
// };

// <ConfirmModal visible={confirmVisible} message="คุณแน่ใจหรือว่าต้องการบันทึกข้อมูล?" onConfirm={handleConfirm} onCancel={() => setConfirmVisible(false)}/>
