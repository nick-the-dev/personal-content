/* globals fetch */
var update = document.getElementById("update");
var del = document.getElementById("delete");
var login = document.getElementById("login");
var form = document.getElementById("login-form");

// update.addEventListener("click", function () {
//   fetch("quotes", {
//     method: "put",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       name: "Darth Vader",
//       quote: "I find your lack of faith disturbing.",
//     }),
//   })
//     .then((response) => {
//       if (response.ok) return response.json();
//     })
//     .then((data) => {
//       console.log(data);
//     });
// });

// del.addEventListener("click", function () {
//   fetch("quotes", {
//     method: "delete",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       name: "Darth Vader",
//     }),
//   }).then(function (response) {
//     window.location.reload();
//   });
// });

if (login) {
  login.addEventListener("click", function (e) {
    e.preventDefault();

    const username = form.elements["username"];
    const password = form.elements["password"];

    fetch("/login", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: document.querySelector("#username").value,
        password: document.querySelector("#password").value,
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        if (data) {
          //console.log(data);
          window.location.href = data.url;
        }
      })
      .catch((err) => console.error(err));
  });
}
