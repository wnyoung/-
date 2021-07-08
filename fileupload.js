const express = require('express');
const router = express.Router();
const multer = require("multer");

// 1. multer �̵����� ����
let upload = multer({
    dest: "upload/"
})

// �� ������ ����
router.get('/show', function (req, res, next) {
    res.render("board")
});

// 2. ���� ���ε� ó��
router.post('/create', upload.single("imgFile"), function (req, res, next) {
    // 3. ���� ��ü
    let file = req.file

    // 4. ���� ����
    let result = {
        originalName: file.originalname,
        size: file.size,
    }

    res.json(result);
});

module.exports = router;
