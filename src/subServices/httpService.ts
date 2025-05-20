import express from "express";
import PrsmClient from "./databaseService";
import logger from "../logger";

import * as s from "./services.schama";

//Export those interfaces and types to .schema.ts file

function createReponse<T>(success: boolean, message: string = "Successful", payload?: T): s.ApiResponse<T> {
	return {
		success,
		message,
		payload
	};
}

export default class HttpClient {
	protected _api;
	protected databaseService: PrsmClient;

	get api() {
		return this._api;
	}

	constructor(databaseService: PrsmClient) {

		this.databaseService = databaseService;

		this._api = express();
		this._api.use(express.json());

		this._api.get("/api/ping", (req, res) => {
			res.json(createReponse(true, "Pong!", "Response from the api."));
		});

		this._api.post("/api/insertPost", async (req, res) => {
			try {
				const payload: s.PostInsertTemplate = req.body;
				const response = await this.databaseService.insertPost(payload);

				if (!response.success) {
					res.status(400).json(createReponse(false, response.message));
					return;
				}
				res.status(201).json(createReponse(true, "Post created successfuly", response.payload));
			} catch (err) {
				logger.error(new Error((err as Error).message).stack);
				res.status(500).json(createReponse(false, "Internal server error"));
			}
		});

		this._api.post("/api/publishPost/:postId", async (req, res) => {
			try {
				const { postId } = req.params;
				if (!postId) {
					res.status(404).json(createReponse(false, "Post id is required"));
					return;
				}

				const response = await this.databaseService.editPost({ postId: Number(postId), data: { published: true } });

				res.status(200).json(createReponse(true, response.message, response.payload));

			} catch (err) {
				logger.error(new Error((err as Error).message).stack);
				res.status(500).json(createReponse(false, "Internal server error"));
			}
		});

		this._api.post("/api/editPost/:postId", async (req, res) => {
			try {
				const { postId } = req.params;
				const data: s.EditPostParams = req.body;
				if (!postId) {
					res.status(404).json(createReponse(false, "The post id is required"));
				}
				const result = await this.databaseService.editPost({ postId: Number(postId), data: data })

				res.status(200).json(createReponse(true, result.message, result.payload));
			} catch (err) {
				logger.error(new Error((err as Error).message).stack);
				res.status(500).json(createReponse(false, "Internal server error"));
			}
		});

		this._api.post("/api/search/multiSearch", async (req, res) => {
			try {
				const { quantity, tags, keyword }: s.SearchPostsAndTagsTemplate = req.body.criteria;
				const response = await this.databaseService.multiSearch({ quantity, tags, keyword });
				if (!response.success) {
					res.status(400).json(createReponse(false, response.message, response.payload));
					return;
				}
				res.status(200).json(createReponse(true, response.message, response.payload));
			} catch (err) {
				logger.error((err as Error).stack);
				res.status(500).json(createReponse(false, "Internal server error"));
			}
		});

		this._api.post<{ tagName: string }>("/api/insertTag/:tagName", async (req, res) => {
			try {
				const { tagName } = req.params;
				if (!tagName) {
					res.status(400).json(createReponse(false, "Tag name is required"));
					return;
				}

				const response = await this.databaseService.insertTag({ tag: tagName });

				if (!response.success) {
					res.status(400).json(createReponse(false, response.message, response.payload));
					return;
				}
				res.status(200).json(createReponse(true, response.message, response.payload));
			} catch (err) {
				logger.error((err as Error).stack);
				res.status(500).json(createReponse(false, "Internal server error"));
			}
		});

		this._api.get("/api/getPostById/:postId", async (req, res) => {
			try {
				const { postId } = req.params;

				if (!postId) {
					res.status(400).json(createReponse(false, "Post id is required"));
				}

				const response = await this.databaseService.getPostById({ postId: Number(postId) });

				if (response.success) {
					res.status(200).json(createReponse(true, response.message, response.payload));
					return;
				}
				res.status(404).json(createReponse(false, "Post not found"));
			} catch (err) {
				logger.error(new Error((err as Error).message).stack);
				res.status(500).json(createReponse(false, "Internal server error"));
			}
		});
	}

	listen(port: number): void {
		this._api.listen(port, () => {
			console.log(`HttpService is running on port ${port}`)
		});
	}
}