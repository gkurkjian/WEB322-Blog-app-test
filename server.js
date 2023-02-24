/*********************************************************************************
 *  WEB322 – Assignment 03
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: __George Kurkjian____ Student ID: ___137555207__ Date: ___15 April-2022____
 *
 *  Online (Heroku) URL: ____https://shrouded-brook-39766.herokuapp.com/_________
 *
 *  GitHub Repository URL: _____https://github.com/gkurkjian/WEB322-APP_________
 *
 ********************************************************************************/

// npm init
// npm install express, npm install nodemon, npm run start -- this is useless because it runs for only once, nodemon server.js  --> then npm run start

// added on for Assignment03
// npm install multer, install cloudifier, install streamifier, npm install dotenv

// added on for Assignment04
// npm install express-handlebars

// added on for Assignment05
// npm install i sequelize pg pg-hstore

// added on for Assignment06
// npm install mongoose, npm install client-sessions, 
const express = require("express");
const app = express();

const env = require('dotenv');
env.config();

const path = require("path");
const blogData = require("./blog-service");

const exphbs = require('express-handlebars');
const stripJs = require('strip-js');

const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const clientSessions = require('client-sessions');

const authData = require('./auth-server');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true
});

// const HTTP_PORT = process.env.PORT || 8080;
const HTTP_PORT = process.env.PORT
const onHttpStart = () => console.log(`HTTP Server is now listening on port ${HTTP_PORT} 🚀🚀🚀`)

// multer middleware
const upload = multer()

app.engine(".hbs", exphbs.engine({
  extname: ".hbs",
  helpers:{
      navLink: function(url, options){
          return '<li' +
          ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
          '><a href="' + url + '">' + options.fn(this) + '</a></li>';
      },
      equal: function (lvalue, rvalue, options) {
          if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
          if (lvalue != rvalue) {
          return options.inverse(this);
          } else {
          return options.fn(this);
          }
      },
      makeList: function(data, options){
          let htmlString = "<ul>";
              for(let i = 0; i < data.length; i++){
                  htmlString += `<li>${options.fn(data[i])}</li>`
                 
              }
          htmlString += "</ul>";
          return htmlString;
      },
      safeHTML: function(context){
        return stripJs(context);
      },
      formatDate: function(dateObj){
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
    }    
  }  
}));

app.set('view engine', '.hbs');
app.use(express.static("public"));

app.use(express.urlencoded({extended: true})); 

// added for assignment6
app.use(clientSessions ({
  cookieName: "session",
  secret: "assignment6",
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}))

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});


ensureLogin = (req, res, next) => {
  if(!(req.session.user)) {
    res.redirect("/login");
  } else {
     next(); 
  }  
};

app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = (route == "/") ? "/" : "/" + route.replace(/\/(.*)/, "");
  app.locals.viewingCategory = req.query.category;
  next();
});

app.get("/", (req, res) => {
  res.redirect('/blog');
});

app.get("/about", (req, res) => {
  res.render('about');
});


app.get("/posts/add", ensureLogin, (req, res) => {  // ensureLogin1
  blogData.getCategories().then((data) => {
    res.render("addPost", {categories: data})
  }).catch((err) => {
    res.render("addPost", {categories: []});
  })
});

app.get("/categories/add", ensureLogin, (req, res) => {  // ensureLogin2
  res.render('addCategory')
})

app.post('/categories/add', ensureLogin, (req, res) => {  // ensureLogin3
  blogData.addCategory(req.body).then((data) => {
    res.redirect('/categories')
  }).catch((err) => {
    console.log(err);
  })
})

app.post('/posts/add', ensureLogin, upload.single("featureImage"), (req,res)=>{  //ensureLogin4
  if(req.file){
      let streamUpload = (req) => {
          return new Promise((resolve, reject) => {
              let stream = cloudinary.uploader.upload_stream(
                  (error, result) => {
                      if (result) {
                          resolve(result);
                      } else {
                          reject(error);
                      }
                  }
              );
  
              streamifier.createReadStream(req.file.buffer).pipe(stream);
          });
      };
  
      async function upload(req) {
          let result = await streamUpload(req);
          console.log(result);
          return result;
      }
  
      upload(req).then((uploaded)=>{
          processPost(uploaded.url);
      });
  }else{
      processPost("");
  }
  
  function processPost(imageUrl){
      req.body.featureImage = imageUrl;
  
      // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts
      blogData
        .addPost(req.body)
        .then((data) => {
          res.redirect("/posts");
        })
        .catch((error) => {
          res.send({
            error,
          });
        });
    }    
})



// replaced the app.get("/blog") --> to new one
app.get('/blog', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blogData.getPublishedPostsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          posts = await blogData.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // get the latest post from the front of the list (element 0)
      let post = posts[0]; 

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;
      viewData.post = post;

  }catch(err){
      viewData.message = "no results 1";
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blogData.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results 2"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})

});

// forgot to include this!!!
app.get('/blog/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blogData.getPublishedPostsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          posts = await blogData.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;

  }catch(err){
      viewData.message = "no results 3";
  }

  try{
      // Obtain the post by "id"
      viewData.post = await blogData.getPostById(req.params.id);
  }catch(err){
      viewData.message = "no results 4"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blogData.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results 5"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})
});

app.get("/posts", ensureLogin, (req, res) => {  // ensureLogin5
  if (req.query.category) {
    blogData.getPostsByCategory(req.query.category).then((data) => {  // user will determine which category will choose by adding ?category=value
      if (data.length > 0) {
        res.render("posts", {posts: data});
      } else {
        res.render("posts", {message: "no results 6"})
      }
    }).catch((error) => {
      res.render("posts", {message: "no results "});
    })
  }
  else if (req.query.minDate) {
    blogData.getPostsByMinDate(req.query.minDate).then((data) => {
      if (data.length > 0) {
        res.render("posts", {posts: data});
      } else {
        res.render("posts", {message: "no results 7"})
      }
    }).catch((error) => {
      res.render("posts", {message: "no results "});
    })
  }
  else {
    blogData.getAllPosts().then((data) => {
      if (data.length > 0) {
        res.render("posts", {posts: data});
      } else {
        res.render("posts", {message: "no results 8"});
      }
    }).catch((error) => {
      res.render("posts", {message: "no results"});
    });
  }
});

app.get("/post/:id", ensureLogin, (req, res)=>{  //ensureLogin6
  blogData.getPostById(req.params.id).then((data) => {
     res.json(data);
  }).catch((error) => {
    res.json(error);
  })
});


app.get("/categories", ensureLogin, (req, res) => {  //ensureLogin7
  blogData.getCategories().then((data) => {
    if (data.length == 0) {
      res.render("categories", {categories: data, message: "no categories!"});
    } else {
      res.render("categories", {categories: data});
    }
    }).catch((error) => {
      res.render("categories", {message: "no results 9"});
    });
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {  // ensureLogin8
  blogData.deleteCategoryById(req.params.id).then(() => {
    res.redirect('/categories')
  }).catch((err) => {
    res.status(500).send({message: "Unable to Remove Category / Category not found"})
  })
})

app.get("/posts/delete/:id", ensureLogin, (req, res) => {  // ensureLogin9
  blogData.deletePostById(req.params.id).then(() => {
    res.redirect('/posts')
  }).catch((err) => {
    res.status(500).send({message: "Unable to Remove Category / Category not found"})
  })
})

// added on for assignment6
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  authData.registerUser(req.body)
  .then(() => {
    res.render("register", {successMessage: "User created"})
  })
  .catch((err) => {
    res.render("register", {errorMessage: err, userName: req.body.userName});
  })
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body).then((user) => {
    req.session.user = {
      userName: user.userName, // authenticated user's userName
      email: user.email, // authenticated user's email
      loginHistory: user.loginHistory// authenticated user's loginHistory
    }   
    res.redirect('/posts');
}).catch((err) => {
  res.render("login", {errorMessage: err, userName: req.body.userName});
})

});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/login");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory", { user: req.body.user });
});

app.use((req, res) => {
  res.status(404).render('404');
});

authData.initialize().then(() => {
    app.listen(HTTP_PORT, onHttpStart)
    console.log("app listening on: " + HTTP_PORT);
  }).catch((err) => {
    console.log("unable to start the server " + err);
  });