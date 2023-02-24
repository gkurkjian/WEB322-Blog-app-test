// const res = require('express/lib/response');
const Sequelize = require('sequelize');

var sequelize = new Sequelize('ubjxmawk', 'ubjxmawk', 'BZv44GWYKUQJTLM9rxfiUu8QlHTqBtQi', {
  host: 'peanut.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
      ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});


const Post = sequelize.define('Post', {

  body:Sequelize.TEXT,
  title:Sequelize.STRING,
  postDate:Sequelize.DATE,
  featureImage:Sequelize.STRING,
  published:Sequelize.BOOLEAN
})

const Category = sequelize.define('Category', {
  category:Sequelize.STRING
})


Post.belongsTo(Category, {foreignKey: 'category'});
//Category.hasMany(Post);


module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
      sequelize.sync().then(() => {
        resolve('The Database Synced!')
      })
      .catch((err) => {
        reject('unable to sync the database')
      });
    });
};


module.exports.getAllPosts = function(){
  return new Promise((resolve,reject)=>{
      //sequelize.sync().then(function(){
          Post.findAll().then(postData=>{
              resolve(postData)
          }).catch((err) => {
          reject("No posts found");
      })
  });
};

module.exports.getPostsByCategory = function (category){
  return new Promise((resolve,reject)=>{
      Post.findAll({
          where: {
              category: category
          }
      }).then((postData) => {
          resolve(postData);
      }).catch((err) => {
          reject("No posts found for this category");   
      })
  });
};


module.exports.getPostsByMinDate = function (minDateStr) {
  return new Promise((resolve, reject) => {
    const {gte} = Sequelize.Op;
    Post.findAll({
      where: {
        postDate: {
        [gte]: new Date(minDateStr)
        }
      }
    }).then((postData) => {
      resolve(postData)
    }).catch(err => {
      reject('no results returned.')})
  }) 
}


module.exports.getPostById = function (id) {
  return new Promise((resolve, reject) => {
    Post.findOne(({
      where: {
        id: id
      }
    }))
    .then((postData) => {
      resolve(postData)
    })
    .catch(err => {
      reject('no results returned.')
    });
  })
}

module.exports.addPost = function (postData) {  // this is added
  return new Promise((resolve, reject) => {
    for(var element in postData) {
      if (postData[element] == "") {
        postData[element] = null;
      }
    }
    postData.published = (postData.published) ? true : false;

    // Post.postDate = new Date();// this is wrong. fixed by Suluxan
    postData.postDate = new Date();
    Post.create(postData).then(() => {
      resolve("Post is created")
    }).catch((err) => { 
      reject('Unable to add a new post.')
    })
  });
};


module.exports.getPublishedPosts = function () {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        published: true
      }
    }).then((postData) => {
      resolve(postData);
    })
    .catch(err => {reject('no results returned.')})
  });
};

module.exports.getPublishedPostsByCategory = function(category) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        published: true,
        category: category
      }
    })
    .then((postData) => {
      resolve(postData);
    }).catch((error) => {
      reject("No published post founded here");
    })
  });
}

module.exports.getCategories = function () {
  return new Promise((resolve, reject) => {
    Category.findAll().then((categoryData) => {
      resolve(categoryData);
    }).catch((error) => {
      reject("Category not founded here");
    })
  });
};

// those are newly added for the assignment05
module.exports.addCategory = function(categoryData) {
  return new Promise((resolve, reject) => {
    for(var element in categoryData) {
      if (categoryData[element] == "") {
        categoryData[element] = null;
      }
    }
    Category.create(categoryData).then(() => {  // here I should include if and else statements
      resolve("Post is created");
    }).catch((err) => {
      reject('unable to create post.')
    })
  });
};

exports.deleteCategoryById = function(id) {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: {
        id: id  // in the JSON file was id and our variable name id as a well, therefore -> where id: id
      }
    }).then(() => {
      resolve("Category is Destroyed")
    })
    .catch((err) => {
      reject("Was rejected")
    })
  });
}

exports.deletePostById = function(id) {
  return new Promise((resolve, reject) => {
    Post.destroy({
      where: {
        id: id
      }
    }).then(() => {
      resolve("Post is Destroyed")
    })
    .catch((err) => {
      reject("Was rejected")
    })
  })
}

