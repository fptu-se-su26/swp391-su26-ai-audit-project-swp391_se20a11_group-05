$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:9099/reverse/")
$listener.Start()
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $json = '{"address":{"ward":"Hai Chau I"}}'
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
        $context.Response.ContentType = "application/json"
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        $context.Response.OutputStream.Close()
    }
}
finally {
    $listener.Stop()
}
