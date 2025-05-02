import DbClient from "./subServices/databaseService";
import HttpClient from "./subServices/httpService";

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