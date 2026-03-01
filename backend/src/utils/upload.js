import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import config from "../config/index.js";
import { ApiError } from "./ApiError.js";

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, config.upload.dir);
	},
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname);
		cb(null, `${uuidv4()}${ext}`);
	},
});

const fileFilter = (_req, file, cb) => {
	const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(ApiError.badRequest("Only JPEG, PNG, WebP and GIF images are allowed"), false);
	}
};

const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: config.upload.maxFileSize },
});

export default upload;
