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



app.enable('trust proxy')
app.use(cors())
app.options('*', cors())

// Set security HTTP headers
app.use(helmet());
// Limit requests from same IP
const limiter = rateLimit({
    max: 200,
    windowMs: 60*1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

app.use(express.json({ limit : '10kb' }));
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