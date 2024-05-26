import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-', 36);
const imageName = `${nanoid()}_${Date.now()}.jpg`;

console.log(imageName);
