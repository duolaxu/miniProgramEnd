const express = require('express');
const multer = require("multer");
const printLog = require("../../log")(); // 引入日志管理
const fetch = require("node-fetch");
const router = express.Router();

const imgFiles = {
    '0': 'recentHouse',
    '1': 'secondHand',
    '2': 'recruitment',
    '3': 'user'
}

// 通过 filename 属性定制
var storage = multer.diskStorage({ // 磁盘存储引擎
    destination: function (req, file, cb) { // 控制文件在哪里存储
        cb(null, `../upload/${imgFiles[req.headers.imgtype]}`); // 保存的路径，备注：需要自己创建
    },
    filename: function (req, file, cb) { // 文件夹中的文件名
        // if (req.headers.imgtype == 5) {
        let imgArr = file.originalname.split(".");
        let imgType = imgArr[imgArr.length - 1];
        file.originalname = req.headers.userid + '_' + Date.now() + '.' + imgType;
        cb(null, file.originalname);
        // } else {
        // file.originalname = Date.now() + file.originalname;
        // cb(null, file.originalname);
        // }

    }
});

var upload = multer({ // 设置上传文件存储路径
    storage: storage
}).single('file');


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
        console.log(req.headers.imgtype);
        let path = "/recentHouse";
        if (req.headers.imgtype == 0) {
            path = "/recentHouse/";
        }
        else if (req.headers.imgtype == 1) {
            path = '/secondHand/';
        }
        else if (req.headers.imgtype == 2) {
            path = '/recruitment/';
        }
        else if (req.headers.imgtype == 3) {
            path = '/user/';
        }
        let url = path + req.file.originalname;

        res.send({
            code: 0,
            url,
            msg: ""
        });
    })
})

// 登录
router.post("/login", async (req, res) => {
    const db = require('../database');
    // printLog(req.body.username);
    console.log("log = ", printLog.info(req.body.username));
    await db.query(`SELECT * FROM admin where adminName='${req.body.username}'`, data => {
        if (data.length === 0) {
            res.send({
                code: -1,
                data,
                msg: "用户不存在"
            })
        } else {
            if (data[0].adminPassword === req.body.password) {
                res.send({
                    code: 0,
                    data: {
                        data: data[0],
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



    // 微信小程序获取openid
    router.post('/getOpenId', async (req, res) => {

        async function getOpenId(data) {
            const res = await fetch(`https://api.weixin.qq.com/sns/jscode2session?appid=wx8841e9ac9c9acf37&secret=b74755c0b5cad0dd203775dd15337dab&js_code=${data.code}&grant_type=authorization_code`)
            // console.log("res = ",res.json());
            return await res.json();
        }

        let data = req.body;
        // console.log("data = ", data);
        const db = require('../database');
        const result = await getOpenId(data);
        console.log("result = ", result);
        await db.query(`select userId,openId from customer`, data => {
            let lent = data.length;
            let judge = false; // 判断是否为新用户
            let userid = -1;
            for (let i = 0; i < lent; i++) {
                if (data[i].openId == result.openid) {
                    // console.log("data[i] = ", data[i])
                    judge = true;
                    userid = data[i].userId;
                    result.userId = userid;
                    break;
                }
            }
            if (judge) {
                // console.log("result = ", result);
                res.send({
                    code: 0,
                    data: result,
                    msg: ""
                })
            } else {
                db.query(`insert into customer(userName,userImg,openId) values('微信用户','/customerImg/default.png','${result.openid}')`, data => {
                    // console.log("DATA = ", data);
                }),
                    result.userId = data.length + 1;
                res.send({
                    code: -1,
                    data: result,
                    msg: ""
                })
            }
        })
    })

router.post("/getUser", async (req, res) => {
    const db = require('../database');
    await db.query(`SELECT * FROM customer where userId = '${req.body.userId}'`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

router.post("/updateUserInfo", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    const sqls = [
        `update customer set userImg='${data.userImg}' where openId='${data.openId}'`,
        `update customer set userName='${data.userName}' where openId='${data.openId}'`
    ]
    await db.query(sqls[req.headers.infotype], data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

router.post("/insertInfos", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`insert into infos(openId,infosImg,infosText,infosType) values('${data.openId}','${data.infosImg}','${data.infosText}','${data.infosType}')`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

router.post("/getInfos", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`select * from infos where infosType=${data.infosType}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 更新用户授权信息
router.post("/updateAuthorization", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`update customer set authorization='true' where userId=${data.userId}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "更新失败，请稍后重试"
            })
        }
    });
})

// 用户反馈
router.post("/insertFeedBack", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    console.log("data = ", data);
    await db.query(`insert into feedback(feedbackInfos,userId) values('${data.feedbackInfos}',${data.userId})`, data => {
        if (data) {
            res.send({
                code: 0,
                data: '',
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 获取用户反馈
router.post("/getFeedBack", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`select * from feedback`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 引入房源信息
router.post("/insertHouse", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`insert into housing(houseImg,houseInfo,houseType,housePrice,houseAddress,houseConnection,houseDate,houseRoom,userId,auditStatus) 
    values('${data.houseImg}','${data.houseInfo}','${data.houseType}','${data.housePrice}',
    '${data.houseAddress}','${data.houseConnection}','${data.houseDate}','${data.houseRoom}',${data.userId},0)`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 获取房源信息
router.post("/getHouses", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    let sql = "";
    if (data.houseType == '全部') {
        sql = `select * from housing inner join customer on housing.userId=customer.userId ${data.region === '全部' ? '' : `and housing.region='${data.region}'`} and housing.auditStatus=1 and searchKey like "${'%' + data.searchName + '%'}" limit ${data.firstIndex},${data.endIndex}`;
    } else {
        sql = `select * from housing inner join customer on housing.userId=customer.userId and housing.houseType='${data.houseType}' ${data.region === '全部' ? '' : `and housing.region='${data.region}'`} and housing.auditStatus=1 and searchKey like "${'%' + data.searchName + '%'}" limit ${data.firstIndex},${data.endIndex}`;
    }
    await db.query(sql, data => {
        console.log("data = ", data);
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 获取二手物品表信息
router.post("/getSecondHand", async (req, res) => {
    const db = require('../database');
    // let data = req.body;
    // let sql = "";
    // if (data.houseType == '全部') {
    //     sql = `select * from housing inner join customer on housing.userId=customer.userId ${data.region === '全部' ? '' : `and housing.region='${data.region}'`}`;
    // } else {
    //     sql = `select * from housing inner join customer on housing.userId=customer.userId and housing.houseType='${data.houseType}' ${data.region === '全部' ? '' : `and housing.region='${data.region}'`}`;
    // }
    await db.query(`select * from secondHands inner join customer on secondHands.userId=customer.userId and secondHands.auditStatus=1 limit ${data.firstIndex},${data.endIndex}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 引入二手物品信息
router.post("/insertSecondHand", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`insert into secondHands(goodsName,goodsConnection,userId,goodsImg,goodsDate,goodsInfos,goodsPrice,auditStatus) 
    values('${data.goodsName}','${data.goodsConnection}',${data.userId},'${data.goodsImg}',
    '${data.goodsDate}','${data.goodsInfos}','${data.goodsPrice}',0)`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 引入招聘信息
router.post("/insertRecruit", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`insert into recruitment(recruitName,recruitConnection,recruitType,recruitAddress,recruitSalary,recruitInfos,recruitImg,userId,recruitDate,auditStatus) 
    values('${data.recruitName}','${data.recruitConnection}','${data.recruitType}','${data.recruitAddress}',
    '${data.recruitSalary}','${data.recruitInfos}','${data.recruitImg}',${data.userId},'${data.recruitDate}',0)`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 获取招聘信息
router.post("/getRecruit", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    let sql = "";
    if (data.region == '全部') {
        sql = `select * from recruitment inner join customer on recruitment.userId=customer.userId and recruitment.auditStatus=1 limit ${data.firstIndex},${data.endIndex}`;
    } else {
        sql = `select * from recruitment inner join customer on recruitment.userId=customer.userId and recruitment.region='${data.region}' and recruitment.auditStatus=1 limit ${data.firstIndex},${data.endIndex}`;
    }
    await db.query(sql, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 搜索招聘信息
router.post("/searchRecruit", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    let sql = "";
    if (data.region == '全部') {
        sql = `select * from recruitment inner join customer where recruitment.userId=customer.userId and searchKey like "${'%' + data.searchName + '%'}" and recruitment.auditStatus=1 limit ${data.firstIndex},${data.endIndex}`;
    } else {
        sql = `select * from recruitment inner join customer where recruitment.userId=customer.userId and region='${data.region}' and searchKey like "${'%' + data.searchName + '%'}" and recruitment.auditStatus=1 limit ${data.firstIndex},${data.endIndex}`;
    }
    await db.query(sql, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 搜索物品信息
router.post("/searchGoods", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    // let sql = "";
    // if (data.region == '全部') {
    //     sql = `select * from recruitment inner join customer on recruitment.userId=customer.userId`;
    // } else {
    //     sql = `select * from recruitment inner join customer on recruitment.userId=customer.userId and recruitment.region='${data.region}'`;
    // }
    await db.query(`select * from secondHands inner join customer where secondHands.userId=customer.userId and searchKey like "${'%' + data.searchName + '%'}" and secondHands.auditStatus=1  limit ${data.firstIndex},${data.endIndex}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 我的发布信息
router.post("/mineRelease", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    let sql = "";
    if (data.infotype == '0') {
        sql = `select * from housing inner join customer where customer.userId=housing.userId and housing.userId=${data.userId}`;
    } else if (data.infotype == '1') {
        sql = `select * from secondHands inner join customer where secondHands.userId=${data.userId} and customer.userId=secondHands.userId`;
    } else if (data.infotype == 2) {
        sql = `select * from recruitment inner join customer where recruitment.userId=${data.userId} and customer.userId=recruitment.userId`;
    }
    await db.query(sql, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 信息举报接口
router.post("/insertReport", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    console.log("data = ", data);
    await db.query(`insert into report(surface,infoId,reportInfo) values('${data.table}','${data.Id}','${data.reportInfo}')`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "更新失败，请稍后重试"
            })
        }
    });
})

// 信息举报接口
router.post("/getReport", async (req, res) => {
    const db = require('../database');
    await db.query(`select * from report`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 获取挂件信息
router.post("/getPendant", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`select * from pendant where pendantName='${data.pendantName}'`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 获取用户聊天记录
router.post("/getMessage", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`select * from chat where userId like "%,${data.userId}" or userId like "${data.userId},%"`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 以下为管理系统接口

// 获取全部挂件
router.post("/getPendantAll", async (req, res) => {
    const db = require('../database');
    // db.query(`select count(recruitId) from recruitment`, counts => {
    //     total = counts;
    // })
    await db.query('select * from pendant', data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 挂件开关
router.post("/updatePutIn", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`update pendant set putIn='${data.putIn}' where pendantId=${data.pendantId}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "更新失败，请稍后重试"
            })
        }
    });
})

// 更新挂件信息
router.post("/updatePendant", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`update pendant set imgLink='${data.imgLink}',jumpUrl='${data.jumpUrl}',pendantName='${data.pendantName}' where pendantId=${data.pendantId}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "更新失败，请稍后重试"
            })
        }
    });
})

// 新增挂件
router.post("/insertPendant", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`insert into pendant(imgLink,jumpUrl,pendantName) values('${data.imgLink}','${data.jumpUrl}','${data.pendantName}')`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "更新失败，请稍后重试"
            })
        }
    });
})


// 获取招聘信息
router.post("/getRecruitAll", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    let sql = "";
    let total = 0;
    db.query(`select count(recruitId) from recruitment`, counts => {
        total = counts;
    })
    if (data.region == '全部') {
        sql = `select * from recruitment inner join customer on recruitment.userId=customer.userId limit ${data.firstIndex},${data.endIndex}`;
    } else {
        sql = `select * from recruitment inner join customer on recruitment.userId=customer.userId and recruitment.region='${data.region}' limit ${data.firstIndex},${data.endIndex}`;
    }
    await db.query(sql, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                total,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 获取二手物品表信息
router.post("/getSecondHandAll", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    let total = 0;
    db.query(`select count(goodsId) from secondHands`, counts => {
        total = counts;
    })
    await db.query(`select * from secondHands inner join customer on secondHands.userId=customer.userId limit ${data.firstIndex},${data.endIndex}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                total,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 获取房源信息
router.post("/getHousesAll", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    let sql = "";
    let total = 0;
    if (data.houseType == '全部') {
        sql = `select * from housing inner join customer on housing.userId=customer.userId ${data.region === '全部' ? '' : `and housing.region='${data.region}'`} limit ${data.firstIndex},${data.endIndex}`;
    } else {
        sql = `select * from housing inner join customer on housing.userId=customer.userId and housing.houseType='${data.houseType}' ${data.region === '全部' ? '' : `and housing.region='${data.region}'`} limit ${data.firstIndex},${data.endIndex}`;
    }
    db.query(`select count(houseId) from housing`, counts => {
        total = counts;
    })
    await db.query(sql, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                total,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "查询失败，请稍后重试"
            })
        }
    });
})

// 房屋信息审核接口
router.post("/updateHousing", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`update housing set auditStatus='${data.auditStatus}',rejectReason='${data.rejectReason}' where houseId=${data.houseId}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "更新失败, 请稍后重试"
            })
        }
    });
})

// 招聘信息审核接口
router.post("/updateRecruit", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`update recruitment set auditStatus='${data.auditStatus}',rejectReason='${data.rejectReason}' where recruitId=${data.recruitId}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "更新失败, 请稍后重试"
            })
        }
    });
})

// 物品信息审核接口
router.post("/updateSecondHand", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`update secondHands set auditStatus='${data.auditStatus}',rejectReason='${data.rejectReason}' where goodsId=${data.goodsId}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "更新失败, 请稍后重试"
            })
        }
    });
})

// 状态更新统一接口
router.post("/updateInfoStatus", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    let sql = ``;
    if (data.infotype == 1) {
        sql = `update housing set auditStatus='${data.auditStatus}' where houseId=${data.id}`;
    } else if (data.infotype == 2) {
        sql = `update secondHands set auditStatus='${data.auditStatus}' where goodsId=${data.id}`;
    } else if (data.infotype == 3) {
        sql = `update recruitment set auditStatus='${data.auditStatus}' where recruitId=${data.id}`;
    }
    await db.query(sql, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "更新失败, 请稍后重试"
            })
        }
    });
})

// 获取城市区域划分
async function getCityArea(cityCode) {
    const res = await fetch(`https://apis.map.qq.com/ws/district/v1/getchildren?id=${cityCode}&key=YLJBZ-DKCLX-PH34U-T4PXO-PVG23-ECBXK`)
    // console.log("res = ",res.json());
    return await res.json();
}

router.post('/getCityArea', async (req, res) => {
    let data = req.body;
    const result = await getCityArea(data.cityCode);
    if (result) {
        res.send({
            code: 0,
            data: result,
            msg: ""
        })
    } else {
        res.send({
            code: -1,
            data: [],
            msg: "更新失败, 请稍后重试"
        })
    }
})

// 添加信息发布地区
router.post("/selectArea", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    let sql = "";
    if (data.infotype == 1) {
        sql = `update housing set region='${data.region}' where houseId=${data.houseId}`;
    } else if (data.infotype == 2) {
        sql = `update secondHands set region='${data.region}' where goodsId=${data.goodsId}`;
    } else if (data.infotype == 3) {
        sql = `update recruitment set region='${data.region}' where recruitId=${data.recruitId}`;
    }
    await db.query(sql, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "更新失败, 请稍后重试"
            })
        }
    });
})

// 修改搜索字段
router.post("/changeSearchKey", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    let sql = "";
    if (data.infotype == 1) {
        sql = `update housing set searchKey='${data.searchKey}' where houseId=${data.houseId}`;
    } else if (data.infotype == 2) {
        sql = `update secondHands set searchKey='${data.searchKey}' where goodsId=${data.goodsId}`;
    } else if (data.infotype == 3) {
        sql = `update recruitment set searchKey='${data.searchKey}' where recruitId=${data.recruitId}`;
    }
    await db.query(sql, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "更新失败, 请稍后重试"
            })
        }
    });
})

async function getAccessToken() {
    const res = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&routerid=wx8841e9ac9c9acf37&secret=b74755c0b5cad0dd203775dd15337dab`)
    // console.log("res = ",res.json());
    return await res.json();
}

async function getOpenId(token, openId, templateId, message, time, userName) {
    const res = await fetch(`https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`,
        {
            method: 'post',
            body: JSON.stringify({
                access_token: token,
                touser: openId,
                template_id: templateId,
                page: '/pages/myMessage/index',
                data: {
                    "thing2": {
                        "value": message
                    },
                    "time3": {
                        "value": time
                    },
                    "thing1": {
                        "value": userName
                    },
                },
                miniprogram_state: 'developer',
                lang: 'zh_CN',
            }),
            headers: {
                'Content-Type': 'routerlication/json'
            }
        })
    return await res.json();
}

// 发送微信通知
router.post("/sendWeChats", async (req, res) => {
    let data = req.body;
    console.log("data = ", data);
    const accessData = await getAccessToken();
    // console.log("凭证 = ", accessData);
    const resData = await getOpenId(accessData.access_token, data.openId, data.templateId, data.message, data.time, data.userName);
    res.send({
        code: 0,
        data: resData,
        message: '消息通知成功',
    })
})

// 获取用户消息通知剩余次数
router.post("/getMessagesNumber", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`select messageNumber from customer where userId=${data.userId}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "更新失败, 请稍后重试"
            })
        }
    });
})
router.post("/updateMessagesNumber", async (req, res) => {
    const db = require('../database');
    let data = req.body;
    await db.query(`update customer set messageNumber=${data.messagesNumber} where userId=${data.userId}`, data => {
        if (data) {
            res.send({
                code: 0,
                data,
                msg: ""
            })
        } else {
            res.send({
                code: -1,
                data: [],
                msg: "更新失败, 请稍后重试"
            })
        }
    });
})

module.exports = router;