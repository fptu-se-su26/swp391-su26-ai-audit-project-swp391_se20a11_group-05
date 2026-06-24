async function tryLogin() {
  const pwds = ["123456", "password", "Police123!", "Admin123!"];
  for (const pwd of pwds) {
    const res = await fetch("http://localhost:8081/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Police157", password: pwd })
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log("Success with pwd:", pwd);
      console.log("Response:", data);
      return;
    }
  }
  console.log("All passwords failed");
}
tryLogin();
