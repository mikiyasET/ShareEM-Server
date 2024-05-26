import prisma from "./client";
import fs from "fs";

let change = false;
const tags = [
    'adult',
    'relationship',
    'friendship',
    'family',
    'mentalIllness',
    'school',
    'abuse',
    'health',
    'funny',
    'disappointing',
    'conspiracy',
]
const createTags = async () => {
    const check = await prisma.tag.count();
    if (check == 0) {
        for (const tag of tags) {
            await prisma.tag.create({
                data: {
                    name: tag
                }
            })
        }
        change = true;
        console.log('[+] Tags created')
    }
}
const createImageDir = () => {
    const dir = `${process.cwd()}/public/up_image`;
    if (!fs.existsSync(dir)) {

        fs.mkdirSync(dir, {recursive: true});
        change = true;
        console.log('[+] Image directory created')
    }
}
const setup = async () => {
    await createTags();
    createImageDir();
    if (change) {
        console.log('[+] Setup completed')
    }
}
export default setup;