const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = express();
const categoriesRoutes = require('./routes/categoriesRoutes');
const postsRoutes = require('./routes/postsRoutes');
const usersRoutes = require('./routes/usersRoutes');
const errorMiddleware = require('./utils/errors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cors = require('cors');
const compression = require('compression');





dotenv.config({ path: './.env' });
mongoose.connect(process.env.MONGO_URL , 
    {useNewUrlParser: true, 
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(console.log('DB connected ....')).catch(err=> console.log(err));

var corsOptions = {
  origin: ['https://mern-blog-react.vercel.app', 'http://localhost:3000', 'https://www.raniadev-blog.tk'],
  credentials : true
 }

app.enable('trust proxy')
app.use(cors(corsOptions))
//app.options('*', cors())
app.use(function (req, res, next) {
  //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Origin', 'https://www.raniadev-blog.tk');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type', 'X-HTTP-Method-Override', 'X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// Set security HTTP headers
app.use(helmet());
// Limit requests from same IP
const limiter = rateLimit({
    max: 200,
    windowMs: 60*1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(cookieParser());

// Data santization against NoSql query injection
app.use(mongoSanitize());
// Data santization against XSS
app.use(xss());
//  prevent paramater pollution
app.use(hpp({
    whitelist: [
      'title', 'content', 'category'
    ]
}));
app.use(compression())

app.use('/api/posts', postsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/users', usersRoutes);
//app.use('/api/comments', commentsRoutes);

//ERROR MIDDLEWARE
app.use(errorMiddleware);



const PORT = process.env.PORT || 5000
app.listen(PORT, (req,res)=>{
    console.log(`Backend running on port : ${PORT}.....`);
})

process.on('SIGTERM', () => {
    console.log('SIGTERM recieved');
    server.close(() => {
      console.log('Process terminated')
    })
  })