const express = require("express");
const expressLayouts = require("express-ejs-layouts");
// const { body, validationResult, check } = require('express-validator')
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

require("./utils/db");
const Contact = require("./model/contact");
const { body, validationResult, check } = require("express-validator");
const methodOverride = require("method-override");

const app = express();
const port = 3000;

// setup method overide
app.use(methodOverride("_method"));

// Konfigurasi flash
app.use(cookieParser("secret"));
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 6000 },
  })
);
app.use(flash());

// gunakan ejs
app.set("view engine", "ejs");

// Third-party middleware
app.use(expressLayouts);

// Built-in middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  const mahasiswa = [
    {
      nama: "Dip2",
      angkatan: "2016",
    },
    {
      nama: "Dip3",
      angkatan: "2017",
    },
    {
      nama: "Dip4",
      angkatan: "2018",
    },
  ];

  res.render("index", {
    nama: "Dip",
    title: "Halaman Home",
    mahasiswa,
    layout: "layouts/main-layout",
  });
});

// Halaman About
app.get("/about", (req, res) => {
  res.render("about", {
    layout: "layouts/main-layout",
    title: "Halaman About",
  });
});

// Halaman Contact
app.get("/contact", async (req, res) => {
  const contacts = await Contact.find();
  res.render("contact", {
    layout: "layouts/main-layout",
    title: "contact",
    contacts,
    msg: req.flash("msg"),
  });
});

// halaman form tambah
app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    layout: "layouts/main-layout",
    title: "Form Tambah Data Contact",
  });
});

// Proses tambah contact

app.post(
  "/contact",
  [
    body("nama").custom(async (value) => {
      const duplikat = await Contact.findOne({ nama: value });
      if (duplikat) {
        throw new Error("Nama contact sudah digunakan");
      }
      return true;
    }),
    body("email").isEmail().withMessage("Not a valid email address"),
    body("nohp")
      .isMobilePhone("id-ID")
      .withMessage("Not a valid phone number for Indonesia"),
  ],
  (req, res) => {
    const results = validationResult(req);
    if (!results.isEmpty()) {
      res.render("add-contact", {
        layout: "layouts/main-layout",
        title: "Form Tambah Data Contact",
        results: results.array(),
      });
    } else {
      const options = { ordered: true };
      Contact.insertMany(req.body, options).then((result) => {
          // kirimkan flash message
          req.flash("msg", "Data berhasil ditambahkan!");
          res.redirect("/contact");
      });
    }
  }
);

// proses delete contact
// app.get("/contact/delete/:nama", async (req, res) => {
//   const contact = await Contact.findOne({ nama: req.params.nama });

//   // jika contact tidak ada
//   if (!contact) {
//     res.status(404);
//     res.send("<h1>404</h1>");
//   } else {
//     // console.log(contact._id)
//     Contact.deleteOne({ _id: contact._id }).then((result) => {
//         req.flash("msg", "Data berhasil dihapus!");
//         res.redirect("/contact");
//     })
//   }
// });
app.delete("/contact", (req, res) => {
  Contact.deleteOne({ nama: req.body.nama }).then((result) => {
    req.flash("msg", "Data berhasil dihapus!");
    res.redirect("/contact");
  });
});

// form ubah data
app.get("/contact/edit/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });
  console.log(contact);

  res.render("edit-contact", {
    layout: "layouts/main-layout",
    title: "Form Edit Data Contact",
    contact,
  });
});

// proses ubah data
app.put('/contact', [
  body('nama').custom( async (value, { req }) => {
    const duplikat = await Contact.findOne({ nama: value })
    if (value !== req.body.oldNama && duplikat) {
      throw new Error('Nama contact sudah digunakan')
    }
    return true
  }),
  body('email').isEmail().withMessage('Not a valid email address'),
  body('nohp').isMobilePhone('id-ID').withMessage('Not a valid phone number for Indonesia')
], (req, res) => {
  const results = validationResult(req)
  if (!results.isEmpty()) {
    res.render('edit-contact', {
      layout: 'layouts/main-layout',
      title: 'Form Edit Data Contact',
      results: results.array(),
      contact: req.body
    })
  } else {
    Contact.updateOne(
        { _id: req.body._id },
        {
            $set: {
                nama: req.body.nama,
                email: req.body.email,
                nohp: req.body.nohp
            }
        }).then((result) => {
            // kirimkan flash message
            req.flash('msg', 'Data berhasil diubah!')
            res.redirect('/contact')
        })

  }

})

// halaman detail
app.get("/contact/:nama", async (req, res) => {
  //   const contact = findContact(req.params.nama);

  const contact = await Contact.findOne({ nama: req.params.nama });
  res.render("detail", {
    layout: "layouts/main-layout",
    title: "Detail",
    contact,
  });
});

app.listen(port, () => {
  console.log(`Mongo Contact App | listening at http://localhost:${port}`);
});
