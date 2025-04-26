import DbClient from "@src/subServices/dbClitent";
import HttpClient from "@src/subServices/httpClient";

export default class App {
    protected prismaClient: DbClient | null = null;
    protected httpClient: HttpClient | null = null;
    constructor() {
        this.prismaClient = new DbClient();
        if (this.prismaClient) {
            this.httpClient = new HttpClient(this.prismaClient);
        }
    }
}