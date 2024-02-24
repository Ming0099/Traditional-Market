const express = require('express');
const router = express.Router();
var path = require('path');
// 루트
router.get('/',function(req, res){
    res.sendFile(path.join(__dirname, '../public/login.html'));
})

router.get('/main',function(req, res){
    res.sendFile(path.join(__dirname, '../public/main.html'));
})

// 회원가입
router.get('/register',function(req, res){
    res.sendFile(path.join(__dirname, '../public/register.html'));
})

/* 추후 웹뷰앱으로 전환 */
// 모바일 루트
router.get('/m',function(req, res){
    res.sendFile(path.join(__dirname, '../public/m/main.html'));
})

// 모바일 메뉴
router.get('/m/menu',function(req,res){
    res.sendFile(path.join(__dirname, '../public/m/menu.html'));
})

// 모바일 로그인
router.get('/m/login',function(req,res){
    res.sendFile(path.join(__dirname, '../public/m/login.html'));
})

// 모바일 회원가입
router.get('/m/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/m/register.html'));
});

// 모바일 상세정보
router.get('/m/info',function(req,res){
    res.sendFile(path.join(__dirname, '../public/m/info.html'));
})

// 모바일 마이페이지
router.get('/m/mypage',function(req,res){
    res.sendFile(path.join(__dirname, '../public/m/my_page.html'));
})

// 모바일 리뷰페이지
router.get('/m/review',function(req,res){
    res.sendFile(path.join(__dirname, '../public/m/review.html'));
})

module.exports = router;