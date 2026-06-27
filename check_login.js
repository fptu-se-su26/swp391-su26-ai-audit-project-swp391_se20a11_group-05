fetch("http://localhost:8081/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "Police157", password: "password" })
}).then(res => res.json()).then(console.log).catch(console.error);
