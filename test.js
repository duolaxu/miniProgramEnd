import express from "express";
import bodyParser from "body-parser";
// import multer from "multer";
// import fetch from "node-fetch";
import query from "./database";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));




// app.use(express.static('upload')); // 指定文件可被外网访问

// const imgFiles = {
//     '0': 'recentHouse',
//     '1': 'secondHand',
//     '2': 'recruitment',
//     '3': 'user'
// }

// // 通过 filename 属性定制
// var storage = multer.diskStorage({ // 磁盘存储引擎
//     destination: function (req, file, cb) { // 控制文件在哪里存储
//         cb(null, `./upload/${imgFiles[req.headers.imgtype]}`); // 保存的路径，备注：需要自己创建
//     },
//     filename: function (req, file, cb) { // 文件夹中的文件名
//         let imgArr = file.originalname.split(".");
//         let imgType = imgArr[imgArr.length - 1];
//         file.originalname = req.headers.userid + '_' + Date.now() + '.' + imgType;
//         cb(null, file.originalname);
//     }
// });

// app.all("*", function (req, res, next) {
//     //设置允许跨域的域名，*代表允许任意域名跨域
//     res.header("Access-Control-Allow-Origin", "*");
//     //允许的header类型
//     res.header("Access-Control-Allow-Headers", "*");
//     //跨域允许的请求方式 
//     res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
//     if (req.method.toLowerCase() == 'options')
//         res.send(200);  //让options尝试请求快速结束
//     else
//         next();
// });





// // 微信小程序获取openid
// app.post('/getOpenId', async (req, res) => {

//     async function getOpenId(data) {
//         const res = await fetch(`https://api.weixin.qq.com/sns/jscode2session?appid=wx166ffa916ebe47be&secret=4757d06c4175d89c3ba9479739eb5c18&js_code=${data.code}&grant_type=authorization_code`)
//         // console.log("res = ",res.json());
//         return await res.json();
//     }

//     let data = req.body;
//     // console.log("data = ", data);
//     // const db = require('./database');
//     const result = await getOpenId(data);
//     // console.log("result = ", result);
//     await query(`select userId,openId from customer`, data => {
//         let lent = data.length;
//         let judge = false; // 判断是否为新用户
//         let userid = -1;
//         for (let i = 0; i < lent; i++) {
//             if (data[i].openId == result.openid) {
//                 // console.log("data[i] = ", data[i])
//                 judge = true;
//                 userid = data[i].userId;
//                 result.userId = userid;
//                 break;
//             }
//         }
//         if (judge) {
//             // console.log("result = ", result);
//             res.send({
//                 code: 0,
//                 data: result,
//                 msg: ""
//             })
//         } else {
//             query(`insert into customer(userName,userImg,openId) values('微信用户','/customerImg/default.png','${result.openid}')`, data => {
//                 // console.log("DATA = ", data);
//             }),
//                 result.userId = data.length + 1;
//             res.send({
//                 code: -1,
//                 data: result,
//                 msg: ""
//             })
//         }
//     })
// })

// app.post("/getUser", async (req, res) => {
//     // const db = require('./database');
//     await query(`SELECT * FROM customer where openId = '${req.body.openId}'`, data => {
//         if (data) {
//             res.send({
//                 code: 0,
//                 data,
//                 msg: ""
//             })
//         } else {
//             res.send({
//                 code: -1,
//                 data: [],
//                 msg: "查询失败，请稍后重试"
//             })
//         }
//     });
// })

// // 获取房源信息
// app.post("/getHouses", async (req, res) => {
//     // const db = require('./database');
//     let data = req.body;
//     let sql = "";
//     if (data.houseType == '全部') {
//         sql = `select * from housing inner join customer on housing.userId=customer.userId ${data.region === '全部' ? '' : `and housing.region='${data.region}'`} and housing.auditStatus=1 and searchKey like "${'%' + data.searchName + '%'}" limit ${data.firstIndex},${data.endIndex}`;
//     } else {
//         sql = `select * from housing inner join customer on housing.userId=customer.userId and housing.houseType='${data.houseType}' ${data.region === '全部' ? '' : `and housing.region='${data.region}'`} and housing.auditStatus=1 and searchKey like "${'%' + data.searchName + '%'}" limit ${data.firstIndex},${data.endIndex}`;
//     }
//     await query(sql, data => {
//         if (data) {
//             res.send({
//                 code: 0,
//                 data,
//                 msg: ""
//             })
//         } else {
//             res.send({
//                 code: -1,
//                 data: [],
//                 msg: "查询失败，请稍后重试"
//             })
//         }
//     });
// })

app.listen(9090, () => console.log("监听"))