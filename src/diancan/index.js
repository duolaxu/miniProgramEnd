const express = require('express');
const multer = require("multer");
// const printLog = require("../../log")(); // 引入日志管理
const fetch = require("node-fetch");
const router = express.Router();
const xmlparser = require('express-xml-bodyparser');

const app = express();
// global.payCallbackData={};

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));




// app.use(express.static('upload')); // 指定文件可被外网访问

const imgFiles = {
    '0': 'headImg',
    '1': 'dishImg',
    '2': 'storeHeadImg',
    '3': 'storeBusinessImg',
    '4': 'cateringLicense',
    '5': 'customerImg',
}

// 通过 filename 属性定制
var storage = multer.diskStorage({ // 磁盘存储引擎
    destination: function (req, file, cb) { // 控制文件在哪里存储
        cb(null, `../upload/${imgFiles[req.headers.imgtype]}`); // 保存的路径，备注：需要自己创建
    },
    filename: function (req, file, cb) { // 文件夹中的文件名
        if (req.headers.imgtype == 5) {
            let imgArr = file.originalname.split(".");
            let imgType = imgArr[imgArr.length - 1];
            file.originalname = req.headers.imgname + '.' + imgType;
            cb(null, file.originalname);
        } else {
            file.originalname = Date.now() + file.originalname;
            cb(null, file.originalname);
        }

    }
});

var upload = multer({ // 设置上传文件存储路径
    storage: storage
}).single('file');

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
// }),


router.post("/uploadImg", function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            res.writeHead(404);
            res.end({
                code: -1,
                msg: err.message
            });
            return
        }
        let path = "/";
        if (req.headers.imgtype == 0) {
            path = "/headImg/";
        }
        else if (req.headers.imgtype == 1) {
            path = '/dishImg/';
        }
        else if (req.headers.imgtype == 2) {
            path = '/storeHeadImg/';
        } else if (req.headers.imgtype == 3) {
            path = '/storeBusinessImg/';
        } else if (req.headers.imgtype == 4) {
            path = '/cateringLicense/';
        } else if (req.headers.imgtype == 5) {
            path = '/'
        }
        let url = path + req.file.originalname;

        res.send({
            code: 0,
            url,
            msg: ""
        });
    })
})




router.post("/login", async (req, res) => {
    const db = require('./database');
    // printLog(req.body.username);
    // console.log("log = ", printLog.info(req.body.username));
    await db.query(`SELECT * FROM merchant where merchantName='${req.body.username}'`, data => {
        if (data.length === 0) {
            res.send({
                code: -1,
                data,
                msg: "用户不存在"
            })
        } else {
            if (data[0].password === req.body.password) {
                res.send({
                    code: 0,
                    data: {
                        merchantName: data[0].merchantName,
                        merchantPhone: data[0].merchantPhone,
                        merchantRegisterDate: data[0].merchantRegisterDate,
                        storeName: data[0].storeName,
                        storeId: data[0].storeId,
                        permission: data[0].permission,
                        headImg: data[0].headImg,
                    },
                    msg: ''
                })
            } else {
                res.send({
                    code: -2,
                    data: [],
                    msg: '密码错误'
                })
            }
        }
    });
}),

    router.get("/getMerchantList", async (req, res) => {
        const db = require('./database');
        await db.query(`SELECT * FROM merchant`, data => {
            if (data) {
                res.send({
                    code: 0,
                    data,
                    msg: ""
                })
            } else {
                res.send({
                    code: 0,
                    data: [],
                    msg: "查询失败，请稍后重试"
                })
            }
        });
    })

router.post("/getCustomer", async (req, res) => {
    const db = require('./database');
    await db.query(`SELECT * FROM customer where openId = '${req.body.openId}'`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

router.post("/getDishList", async (req, res) => {
    const db = require('./database');
    await db.query(`SELECT * FROM dish where storeId = ${req.body.storeId} order by serialNumber asc`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

router.get("/getStoreList", async (req, res) => {
    const db = require('./database');
    console.log("----")
    await db.query(`SELECT * FROM store`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 获取单个商户信息
router.post("/getSingleStore", async (req, res) => {
    const db = require('./database');
    let data = req.body;
    // console.log("----")
    await db.query(`SELECT * FROM store where storeId=${data.storeId}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

router.post("/updateDish", async (req, res) => {
    console.log(req.body);
    const db = require('./database');
    await db.query(`update dish set dishType='${req.body.dishType}',
    dishName='${req.body.dishName}',
    dishImg='${req.body.dishImg || ''}',
    dishPrice='${req.body.dishPrice}' where dishId = ${req.body.dishId}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 新增商铺
router.post("/addNewStore", async (req, res) => {
    // console.log(req.body);
    let data = req.body;
    const db = require('./database');
    await db.query(`Insert into store(storeName,storeLocation,storeConnection,storeOpeningHours,storeHeadImg,storeBusinessImg,cateringLicense) 
    values('${data.storeName}','${data.storeLocation}','${data.storeConnection}','${data.storeOpeningHours}','${data.storeHeadImg}','${data.storeBusinessImg}','${data.cateringLicense}');`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 新增菜品
router.post("/addNewDish", async (req, res) => {
    // console.log(req.body);
    let data = req.body;
    const db = require('./database');
    await db.query(`Insert into dish(dishName,dishType,dishPrice,dishImg,storeId,serialNumber) 
    values('${data.dishName}','${data.dishType}','${data.dishPrice}','${data.dishImg}',${data.storeId},${data.serialNumber});`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "更新失败，请稍后重试"
            })
        }
    });
})

// 改变菜品状态
router.post("/changeDishStatus", async (req, res) => {
    // console.log(req.body);
    let data = req.body;
    const db = require('./database');
    await db.query(`update dish set dishStatus=${req.body.dishStatus} where dishId=${req.body.dishId}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "更新失败，请稍后重试"
            })
        }
    });
})

// 获取菜品分类列表
router.post("/getDishTypeList", async (req, res) => {
    const db = require('./database');
    await db.query(`SELECT dishType FROM dish where storeId = ${req.body.storeId} order by serialNumber asc`, data => {
        if (data) {
            let dishTypeList = [];
            for (let i = 0; i < data.length; i++) {
                if (dishTypeList.indexOf(data[i].dishType) == -1) {
                    dishTypeList.push(data[i].dishType);
                }
            }
            res.send({
                code: 0,
                data: dishTypeList,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 更新菜品排序
router.post("/updateDishSerial", async (req, res) => {
    const db = require('./database');
    await db.query(`update dish set serialNumber = case dishId when ${req.body.dishId_1} then ${req.body.serialNumber + req.body.operationType} when ${req.body.dishId_2} then ${req.body.serialNumber} end where dishId in (${req.body.dishId_1},${req.body.dishId_2}) and storeId=${req.body.storeId};`, data => {
        // 批量更新表数据
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "更新失败，请稍后重试"
            })
        }
    });
})

// 创建订单
router.post("/createOrderDetail", async (req, res) => {
    const db = require('./database');
    let data = req.body;
    console.log("data = ", data);
    await db.query(`Insert into orderDetail(certificate,shopList,orderStatus,orderIndex,orderDate,orderPayType,dineWay,totalPrice,storeName,storeImg,storeConnection,openId,remarks) 
    values('${data.certificate}','${data.shopList}','${data.orderStatus}','${data.orderIndex}','${data.orderDate}','${data.orderPayType}','${data.dineWay}','${data.totalPrice}','${data.storeName}','${data.storeImg}','${data.storeConnection}','${data.openId}','${data.remarks}');`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "更新失败，请稍后重试"
            })
        }
    });
})
async function getOpenId(data) {
    const res = await fetch(`https://api.weixin.qq.com/sns/jscode2session?appid=wx8841e9ac9c9acf37&secret=b74755c0b5cad0dd203775dd15337dab&js_code=${data.code}&grant_type=authorization_code`)
    // console.log("res = ",res.json());
    return await res.json();
}

// 微信小程序获取openid
router.post('/getOpenId', async (req, res) => {
    let data = req.body;
    const db = require('./database');
    const result = await getOpenId(data);
    await db.query(`select openId from customer`, data => {
        console.log("data = ", data[0].openId);
        console.log("result = ", result);
        let lent = data.length;
        let judge = false; // 判断是否为新用户
        for (let i = 0; i < lent; i++) {
            if (data[i].openId == result.openid) {
                judge = true;
                break;
            }
        }
        if (judge) {
            res.send({
                code: 0,
                data: result,
                msg: ""
            })
        } else {
            db.query(`insert into customer(nickName,headImg,openId) values('微信用户','/customerImg/default.png','${result.openid}')`, data => {
                console.log("DATA = ", data);
            }),
                res.send({
                    code: 1,
                    data: result,
                    msg: ""
                })
        }
    })
})

// 获取订单列表
router.post("/getOrderDetail", async (req, res) => {
    const db = require('./database');
    let data = req.body;
    await db.query(`select * from orderDetail where openId='${data.openId}'`, data => {
        // 批量更新表数据
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "更新失败，请稍后重试"
            })
        }
    });
})

// 获取单个订单信息
router.post("/getSingleOrder", async (req, res) => {
    const db = require('./database');
    let data = req.body;
    await db.query(`select * from orderDetail where openId='${data.openId}' and orderIndex='${data.orderIndex}'`, data => {
        // 批量更新表数据
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 更新用户信息
router.post("/updateCustomerInfo", async (req, res) => {
    const db = require('./database');
    let data = req.body;
    await db.query(`update customer set headImg='${data.headImg}',nickName='${data.nickName}' where openId='${data.openId}'`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: 0,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// let payData={};
// 小程序发起支付回调接口
router.post("/payCallback", xmlparser({ trim: false, explicitArray: false }), async (req, res) => {
    let data = req.body;
    // router.post("/getPrePayId", async (req, res) => {
        // global.payCallbackData=data;
    console.log(data);
    res.send({
        code: 0,
        data: global.payCallbackData,
        msg: "paySuccess"
    })
    // })
})

// 轮询获取
// router.post("/getPrePayId", async (req, res) => {
//     let data = req.body;
// })


// app.listen(9091, () => console.log("9091监听"))
module.exports = router;