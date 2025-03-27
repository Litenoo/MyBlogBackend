import { PrismaClient } from "@prisma/client"

export default class App {
    protected prismaClient = new PrismaClient();
    constructor() {
        
    }
}