
// // utils/formatters.js

//     export const formatPhoneDisplay = (digits: any) => {
//     if (!digits) return '';
//     let formatted = '';
//     for (let i = 0; i < digits.length; i++) {
//         formatted += digits[i];
//         if ((i === 2 || i === 5) && i !== digits.length - 1) {
//         formatted += ' - ';
//         }
//     }
//     return formatted;
//     };


//     export const formatIDCardDisplay = (digits: any) => {
//         if (!digits) return '';
//         let formatted = '';
//         for (let i = 0; i < digits.length; i++) {
//         formatted += digits[i];
//         if ((i === 0 || i === 4 || i === 9 || i === 11) && i !== digits.length - 1) {
//             formatted += ' - ';
//         }
//         }
//         return formatted;
//     };

//     export const formatVehicleDisplay = (digits: any) => {
//         if (!digits) return '';
//         let formatted = '';
//         for (let i = 0; i < digits.length; i++) {
//         formatted += digits[i];
//         if ((i === 1) && i !== digits.length - 1) {
//             formatted += ' - ';
//         }
//         }
//         return formatted;
//     };

export const formatPhoneDisplay = (digits: string): string => {
  if (!digits) return '';
  return digits.replace(/(\d{3})(\d{3})(\d{0,4})/, '$1 - $2 - $3').trim();
};

export const formatIDCardDisplay = (digits: string): string => {
  if (!digits) return '';
  return digits.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
};

export const formatVehicleDisplay = (vehicle: string): string => {
  if (!vehicle) return '';
  const match = vehicle.match(/^(\d+)([ก-ฮ]+)(.*)$/);
  if (!match) return vehicle;
  return `${match[1]} ${match[2]}${match[3]}`;
};

// แปลงวันที่เป็น วัน เดือน(ตัวย่อ) ปี
export function formatThaiDate(dateStr: string) {
  const date = new Date(dateStr);
  const thMonthAbbr = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];
  return `${date.getDate()} ${thMonthAbbr[date.getMonth()]} ${date.getFullYear() + 543}`;
}