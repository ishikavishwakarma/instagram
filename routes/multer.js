const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads");
  },
  filename: function (req, file, cb) {
    const unique = uuidv4();
    cb(null, unique + path.extname(file.originalname));
  },
});

function fileFilter(req, file, cb) {
  const filetypes = /jpg|jpeg|png|mp4|avif|mkv/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
//   console.log(path.extname(file.originalname).toLowerCase());
//   console.log(file.mimetype);
  // console.log((req.files.file))
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error("please upload right file"));
  }
}
const upload = multer({ storage, fileFilter, limits: { fileSize: 20000000 } });
module.exports = upload;
