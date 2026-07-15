import CrossPlatformDatePicker from "@/app/components/Datepicker";
import React from "react";
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from "react-native";

interface RowInputProps {
    label: string;
    value: string | Date | null;
    onChange?: (val: any) => void;
    editable?: boolean;
    type?: "text" | "date"; // text หรือ date
    keyboardType?: TextInputProps["keyboardType"];
    onPress?: () => void; // สำหรับ field แบบกดเลือก
}

export default function RowInput({
    label,
    value,
    onChange,
    editable = false,
    type = "text",
    keyboardType = "default",
    onPress,
}: RowInputProps) {
    return (
        <View className="flex-row items-center justify-between  py-4 px-2 bg-white border-b border-gray-200">
            {/* Label */}
            <Text className="text-gray-700 w-32">{label}</Text>

            {/* Value / Input */}
            {type === "date" ? (
                <View className="w-36 ">
                    {editable ? (
                        <CrossPlatformDatePicker
                            value={value as Date | null}
                            onChange={onChange || (() => { })}
                            style={{ textAlign: "right" }}
                        />
                    ) : (
                        // <CrossPlatformDatePicker
                        //     value={value as Date | null}
                        //     onChange={onChange || (() => { })}
                        //     style={{ textAlign: "right" }}
                        // />
                        // <Text className="text-gray-900  text-right">
                        //     {value ? new Date(value).toLocaleDateString() : ""}
                        // </Text>
                        <TextInput
                            value={value ? new Date(value).toLocaleDateString() : ""}
                            onChangeText={onChange}
                            keyboardType={keyboardType}
                            className="flex-1 bg-white px-3 py-2 rounded text-right"
                        />
                    )}
                </View>
            ) : editable ? (
                onPress ? (
                    <TouchableOpacity
                        className="flex-1 bg-white px-3 py-2 rounded border border-gray-300"
                        onPress={onPress}
                    >
                        <Text className="text-right text-gray-900">{value || ""}</Text>
                    </TouchableOpacity>
                ) : (
                    <TextInput
                        value={value as string}
                        onChangeText={onChange}
                        keyboardType={keyboardType}
                        className="flex-1 bg-white px-3 py-2 rounded border-b border-gray-300 text-right"
                    />
                )
            ) : (
                <TextInput
                  value={value as string}
                  onChangeText={onChange}
                  keyboardType={keyboardType}
                  className="flex-1 bg-white px-3 py-2 border-b border-white rounded text-right"
                  editable={false}
                />

                // <View className="flex-1 items-end">
                //     <Text className="text-gray-900">{value || ""}</Text>
                // </View>
            )}
        </View>
    );
}
