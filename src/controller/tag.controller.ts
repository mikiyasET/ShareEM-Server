import {tag, Prisma} from "@prisma/client";
import prisma from "../utils/client";

export const createTag = async (data: Prisma.tagUncheckedCreateInput): Promise<tag> => {
    return prisma.tag.create({
        data: data
    })
}
export const updateTag = async (id: number, data: Prisma.tagUncheckedUpdateInput): Promise<tag> => {
    return prisma.tag.update({
        where: {
            id: id
        },
        data: data
    })
}
export const removeTag = async (id: number): Promise<tag> => {
    return prisma.tag.delete({
        where: {
            id: id
        }
    })
}
export const getTag = async (id: number): Promise<tag | null> => {
    return prisma.tag.findUnique({
        where: {
            id: id
        }
    });
}
export const getTags = async (): Promise<tag[]> => {
    return prisma.tag.findMany();
}