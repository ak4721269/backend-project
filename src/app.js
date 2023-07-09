require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");

require("./db/conn");
const Register = require("./models/registers");
const auth = require("./middleware/auth");
const { json } = require("express");
const { log } = require("console");

//either choose environment port or default port
const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:false}));

//for fetching data from index.html file
app.use(express.static(static_path));
//for fetching data from index.hbs file
app.set("view engine","hbs");

app.set("views", template_path);
hbs.registerPartials(partials_path);

console.log(process.env.SECRET_KEY);

app.get("/",(req,res) => {
    //for default value in case of index.html
    // res.send("Hello from Akash!");
    //for default value in case of index.hbs
    res.render("index");
});

app.get("/account", auth ,(req,res) => {
    res.render("account");

});

app.get("/logout", auth , async(req,res) => {
    
    try {
        console.log(req.user);

        //for single logout
        //req.user.tokens = req.user.tokens.filter((currElement) => {
        //            return currElement.token !== req.token;
        //})

        //logout from all devices
        req.user.tokens = [];
        
        res.clearCookie("jwt");
        console.log("logout successfully");
        await req.user.save();
        res.render("login");
    } catch (error) {
      res.status(500).send(error);  
    }

});

app.get("/register",(req,res) =>{
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});

//create a new user in ourt database
app.post("/register", async (req,res) =>{
    try{
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;


        if(password === cpassword){

            const registerEmployee = new Register({
                firstname : req.body.firstname,
                lastname : req.body.lastname,
                email : req.body.email,
                gender : req.body.gender,
                phone : req.body.phone,
                age : req.body.age,
                password : password,
                confirmpassword :cpassword
            });

            console.log("the success part" + registerEmployee);

            const token = await registerEmployee.generateAuthToken();
            console.log("the token part" + token);

            //The res.cookie function is used to set the cookie name to value.
            //The value parameter may be a string or converted to JSON.
            //httpOnly to avoid client side modification

            res.cookie("jwt", token ,{
                expires:new Date(Date.now() + 60000),
                httpOnly:true
            });    
            console.log(cookie);

            const registered = await registerEmployee.save();
            res.status(201).render("index");
        }else{
            res.send("password are not matching");
        }

    }catch (error) {
        res.status(400).send(error);
        console.log("the error part page");
    }
});

//login check

app.post("/login", async(req, res) =>{
    try {
        const email = req.body.email;
        const password = req.body.password;

        const useremail = await Register.findOne({email:email});

        const isMatch = await bcrypt.compare(password,useremail.password);

        const token = await useremail.generateAuthToken();
        console.log("the token part" + token);

        res.cookie("jwt", token ,{
            expires:new Date(Date.now() + 50000),
            httpOnly:true,
          //  secure:true
        }); 
        
        console.log(`${req.cookies.jwt}`);

        if(isMatch){
            res.status(201).render("index");
        }else{
            res.send("invalid login details");
        }
        
       

 
        
    } catch (error) {
        res.status(400).send("invalid Email");
        
    }
});

// const jwt = require("jsonwebtoken");

// const createToken = async() => {
//     const token = await jwt.sign()
// }



app.listen(port,() =>{
    console.log('server is running at port no '+port);
}); 