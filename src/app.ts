import { PrismaClient } from "@prisma/client";
import { HttpClient } from "./subServices/httpClient";

export default class App {
    protected prismaClient = new PrismaClient();
    protected httpClient = new axios
    constructor() {

    }
}