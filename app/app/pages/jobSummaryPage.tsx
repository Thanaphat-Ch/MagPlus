import { router } from 'expo-router'
import React from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import NavFooter from '../components/NavFooter'
import { h1, h2, h3, page, text } from '../styles/tw'

export default function jobSummaryPage() {
  return (
    <View className={`${page}`}>
            <View className='bg-white flex justify-center h-12 mt-10 pl-5'>
                <TouchableOpacity onPress={()=> router.back}>
                    <Text className={h2}>←</Text>
                </TouchableOpacity>
            </View>
            <ScrollView className={`flex-1 bg-gray-200`}>
                <View className='bg-white flex justify-center h-14 px-4 text-gray-500'>
                    <Text className={h3}>วันพุธที่ 23 ก.ค. 2025</Text>
                </View>
                <View className='bg-blue-300 flex justify-center h-44 px-4 '>
                    <Text className={`${h1} text-center`}>map</Text>
                </View>
                <View className={`flex-1 bg-white pt-7 pb-3 px-8 rounded-bl-3xl rounded-br-3xl`}>
                    <Text className={h2}>เส้นทาง</Text>
                    <View className='justify-between'>
                        <View className='flex-row my-3'>
                            <View className='flex justify-center rounded-xl border-4 border-green-600 w-4 h-4'></View>
                                <View className='flex-1'>
                                    <Text className={`${text} font-medium text-gray-950 ml-3`}>85 บริษัท ไทย จำกัด ตำบล ลาดขวาง อำเภอบ้านโพธิ์ ฉะเชิงเทรา 24140  </Text>
                                    <View className='flex-row'>
                                        <Text className={`${text} font-medium text-gray-500 ml-3`}>08:13  </Text>
                                        <Text className={`${text} font-medium rounded-md bg-green-300 text-green-800 ml-2`}> ขึ้นสินค้า </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View className='justify-between'>
                            <View className='flex-row my-3'>
                                <View className=''>
                                    <View className='flex justify-center rounded-xl border-4 border-purple-600 w-4 h-4'></View>
                                </View>
                                <View className='flex-1'>
                                    <Text className={`${text} font-medium text-gray-950 ml-3`}>49 ซอย...... บริษัท ..... จำกัด ตำบล ลาดขวาง อำเภอบ้านโพธิ์ ฉะเชิงเทรา 24140  </Text>
                                    <View className='flex-row'>
                                        <Text className={`${text} font-medium text-gray-500 ml-3`}>13:33  </Text>
                                        <Text className={`${text} font-medium rounded-md bg-purple-300 text-purple-800 ml-2`}> ลงสินค้า </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View className='border-2 border-gray-200 w-auto my-3'/>
                        <View className='flex-row justify-between my-3 mb-3'>
                            <Text className={text}>ระยะทาง :</Text>
                            <Text className={text}>202 กม.</Text>
                        </View>
                        <View className='flex-row justify-between'>
                            <Text className={text}>เวลาที่ใช้ :</Text>
                            <Text className={text}>5 ชม. 20 น.</Text>
                        </View>
                    </View>
                    <View className={`bg-white h-36 px-8 pt-5 mt-2 rounded-tl-3xl rounded-tr-3xl shadow-gray-200`}>
                        <View className='flex-row justify-between '>
                            <Text className={`${h2}`}>ค่าจ้าง :</Text>
                            <Text className={`${h2}`}>฿ 2,500</Text>
                    </View>   
                    <TouchableOpacity className='bg-primary flex justify-center items-center rounded-3xl py-2 mt-3'>
                        <Text className={`${h3} text-white`}>กลับหน้าหลัก</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        <NavFooter/>
    </View>
  )
}