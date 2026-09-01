# Module 7: Memory Forensics

Memory forensics is the analysis of a computer's random access memory to extract evidence that exists only while the system is running. Many modern malware samples operate entirely in memory and leave no trace on disk. Encryption keys, passwords, and session tokens exist only in RAM. Network connections, running processes, and loaded modules are all visible in memory. When you need to understand what a system was doing at a specific moment, memory forensics gives you the answer. This module covers RAM acquisition, the Volatility framework, process analysis, network connection analysis, and how to use memory forensics to analyze malware.

## Why Memory Forensics Matters

Traditional disk forensics captures a static snapshot of a system. It shows you what was written to disk, but it does not show you what was happening at the moment of acquisition. Memory forensics fills this gap by capturing the system's live state.

Consider a scenario where a user opens a document that exploits a vulnerability and executes a payload. The payload runs in memory, connects to a C2 server, downloads additional tools, and performs reconnaissance. If you power off the system and examine the disk, you might find the malicious document but not the payload: because the payload operates entirely in memory.

Memory forensics also captures artifacts that disk forensics cannot. Decrypted data, encryption keys, and passwords exist in memory because the system needs them to function. Malware that encrypts its communications on disk may transmit them in plaintext through memory. The attacker's tools, running processes, and network connections are all visible in memory.

The challenge is that memory is volatile. If the system is powered off, memory is lost. If the system continues running, memory contents change. This means memory acquisition must happen quickly, before the evidence is lost or modified.

## RAM Acquisition

Acquiring RAM is the first step in memory forensics. The goal is to capture the contents of physical memory as a forensic image that can be analyzed later.

### Preparing for Acquisition

Before acquiring RAM, prepare your tools and plan your approach.

**Identify the acquisition tool.** Common memory acquisition tools include WinPmem, LiME, DumpIt, and Magnet RAM Capture. Each tool has different features, different system requirements, and different output formats. Choose the tool that fits your situation.

**Prepare the storage medium.** You need a destination for the memory image. A USB drive is the most common option. Ensure the USB drive has sufficient capacity: a system with 16 GB of RAM requires a USB drive with at least 16 GB of free space. The USB drive should be formatted and clean before use.

**Consider the system state.** Some acquisition tools require specific system configurations. WinPmem requires a signed driver. LiME requires building a kernel module for the target system's kernel version. Plan for these requirements before you need them.

**Document the system state.** Before acquiring memory, record the system time, the system uptime, and any relevant system information. This documentation helps with later analysis.

### Acquisition on Windows

WinPmem is the most common tool for Windows memory acquisition. It creates a raw memory image that can be analyzed with Volatility or other memory forensics tools.

The acquisition process:

1. Copy WinPmem to a USB drive
2. Insert the USB drive into the target system
3. Open a command prompt as Administrator
4. Navigate to the USB drive
5. Run `winpmem_mini_x64.exe memdump.raw` (or specify a different output path)
6. Wait for the acquisition to complete: this can take several minutes depending on the amount of RAM
7. Verify the image file exists and has the expected size (approximately equal to the amount of installed RAM)
8. Compute a hash of the image file
9. Document the acquisition

DumpIt is an alternative that requires no configuration. Simply run the DumpIt executable and it captures memory to a raw image file in the current directory.

### Acquisition on Linux

LiME (Linux Memory Extractor) is the standard tool for Linux memory acquisition. LiME is a kernel module that captures the contents of physical memory.

Building LiME for a specific kernel:

1. Install the kernel headers for the target system's kernel version
2. Download the LiME source code
3. Build the LiME kernel module: `make -C /lib/modules/$(uname -r)/build M=$(pwd) modules`
4. This produces a `.ko` file that can be loaded on the target system

Acquiring memory with LiME:

1. Copy the LiME `.ko` file to a USB drive
2. Insert the USB drive into the target system
3. Load the LiME module: `sudo insmod lime.ko "path=/mnt/usb/memory.lime format=lime"`
4. Wait for the acquisition to complete
5. Compute a hash of the image file
6. Document the acquisition

### Acquisition Challenges

Memory acquisition is not always straightforward. Several challenges can complicate the process.

**BitLocker/FileVault encryption.** If the system uses full-disk encryption, the memory image may contain encryption keys that are protected by the encryption. Some acquisition tools can work around this; others cannot.

**Signed drivers.** Windows requires kernel-mode drivers to be signed. If your acquisition tool uses an unsigned driver, Windows will not load it. Ensure your tool's driver is signed or use a tool that does not require a kernel driver.

**System stability.** Memory acquisition is a resource-intensive operation. Acquiring memory on a busy production system can cause performance degradation or system crashes. Acquire memory during low-activity periods if possible.

**Remote systems.** Acquiring memory from a remote system is challenging because the acquisition tool must run on the target system. If you cannot physically access the system, you may need to use a remote management tool to execute the acquisition remotely.

## Volatility Framework

Volatility is the most widely used memory forensics framework. It extracts forensic artifacts from memory images, including running processes, network connections, loaded modules, and registry hives.

### Volatility Architecture

Volatility is a Python-based framework that supports analysis of memory images from multiple operating systems and hypervisors. It uses a plugin architecture where each plugin performs a specific type of analysis.

Volatility 3 is the current version and supports Windows, Linux, and macOS memory images. It runs on Python 3 and is designed for modern memory forensics workflows.

### Basic Volatility Usage

The basic Volatility command structure is:

```
volatility3 -f <memory_image> <plugin_name> [options]
```

The `-f` flag specifies the memory image file. The plugin name specifies the analysis to perform. Additional options vary by plugin.

### Image Identification

Before analyzing a memory image, identify the operating system and architecture. This determines which plugins are applicable.

The `windows.info` plugin identifies Windows memory images:

```
volatility3 -f memory.raw windows.info
```

This produces output showing the Windows version, architecture, kernel base address, and other system information.

For Linux images, use the `linux.info` plugin:

```
volatility3 -f memory.raw linux.info
```

### Common Volatility Plugins

**Process listing:**

```
volatility3 -f memory.raw windows.pslist
volatility3 -f memory.raw windows.pstree
volatility3 -f memory.raw windows.psscan
```

`pslist` lists all processes using the EPROCESS linked list. `pstree` displays processes in a parent-child tree. `psscan` scans for EPROCESS structures and can find processes that have been unlinked from the process list (a common anti-forensics technique).

**Network connections:**

```
volatility3 -f memory.raw windows.netscan
volatility3 -f memory.raw windows.netstat
```

`netscan` scans for network-related structures and displays active and recently closed connections. `netstat` provides a more detailed view of network activity.

**DLL listing:**

```
volatility3 -f memory.raw windows.dlllist
```

Lists all DLLs loaded by each process. This helps identify injected DLLs or unusual module loads.

**Handle listing:**

```
volatility3 -f memory.raw windows.handles
```

Lists all object handles held by each process. This helps identify files, registry keys, mutexes, and other objects accessed by processes.

**Registry analysis:**

```
volatility3 -f memory.raw windows.registry.hivelist
volatility3 -f memory.raw windows.registry.printkey
```

`hivelist` lists all registry hives loaded in memory. `printkey` displays registry keys and values.

**Command history:**

```
volatility3 -f memory.raw windows.cmdline
volatility3 -f memory.raw windows.consoles
```

`cmdline` displays the command line used to start each process. `consoles` displays console command history.

**Memory dumping:**

```
volatility3 -f memory.raw windows.memmap --pid <PID> --dump
```

Dumps the memory of a specific process to a file for further analysis.

### Volatility Scripting

Volatility supports scripting for automated analysis. You can write Python scripts that use the Volatility framework to perform complex analysis tasks.

A basic Volatility script might:

1. Load a memory image
2. Run multiple plugins
3. Correlate results across plugins
4. Generate a report

Scripting is useful for processing multiple memory images or for performing repetitive analysis tasks.

## Process Analysis

Process analysis is the core of memory forensics. By examining running processes, you can identify malicious activity, understand attacker behavior, and reconstruct the timeline of an incident.

### Process Tree Analysis

The process tree shows the parent-child relationships between processes. This tree reveals how processes were started and whether the parent-child relationships are normal.

正常的 Windows 系统有预期的进程树结构. `wininit.exe` starts `services.exe`, which starts all service processes. `winlogon.exe` starts `userinit.exe`, which starts `explorer.exe`. Deviations from this expected structure indicate suspicious activity.

Suspicious process tree indicators:

- `svchost.exe` started by a process other than `services.exe`
- `cmd.exe` or `powershell.exe` started by a web server process (like `w3wp.exe` or `httpd.exe`)
- `mshta.exe`, `wscript.exe`, or `cscript.exe` started by Office applications
- `rundll32.exe` or `regsvr32.exe` started by unusual parents
- Any process with a name that differs from its expected path (e.g., `svchost.exe` running from `C:\Temp\`)

### Process Memory Analysis

Examining the memory contents of individual processes can reveal hidden malware, injected code, and encrypted data.

**Process memory dumping** extracts the memory of a specific process for analysis. Use Volatility's `memmap` or `procdump` plugins to dump process memory.

**String extraction** searches process memory for readable text. Attackers often leave strings in their malware: URLs, IP addresses, file paths, and command structures. Use `strings` or `floss` to extract strings from process memory.

**PE file analysis** examines Portable Executable files loaded in process memory. Malware often loads itself into a legitimate process and modifies its memory to execute malicious code. Identifying modified PE files helps identify injected malware.

### Detecting Process Injection

Process injection is a technique where malware injects code into a legitimate process. The malicious code runs within the context of the legitimate process, making it harder to detect.

Indicators of process injection:

- **Memory protection changes:** Legitimate processes do not typically have executable memory that is also writable. If a process has memory regions with both `PAGE_EXECUTE_READWRITE` protection, it may be the result of injection.

- **Unusual DLL loads:** If a process has loaded a DLL from an unusual path, it may be the result of DLL injection.

- **Thread start addresses:** If a process has threads starting at addresses outside of loaded modules, those threads may be executing injected code.

- **VAD (Virtual Address Descriptor) anomalies:** VADs describe the memory layout of a process. Unusual VAD entries: like entries with executable permissions that do not correspond to loaded modules: indicate injection.

Volatility plugins for detecting injection:

```
volatility3 -f memory.raw windows.vadinfo
volatility3 -f memory.raw windows.malfind
```

`malfind` specifically looks for process injection indicators like executable memory pages with suspicious content.

### Process hollowing detection

Process hollowing is a technique where malware creates a legitimate process in a suspended state, replaces its memory with malicious code, and then resumes the process. The malicious code runs within the context of a legitimate process.

Detecting process hollowing requires comparing the process's in-memory image with its on-disk image. If the images differ significantly, the process may have been hollowed.

Volatility's `procdump` plugin dumps the process memory to a file. Compare this dump with the original executable on disk. Significant differences indicate process hollowing.

## Network Connections in Memory

Memory forensics reveals network connections that may not appear in disk-based evidence. Active connections, recently closed connections, and socket structures all provide evidence of network activity.

### Active Connections

The `netscan` plugin in Volatility reveals active network connections at the time of memory acquisition. This includes:

- **TCP connections:** Source IP, source port, destination IP, destination port, and connection state
- **UDP connections:** Source IP, source port, and destination IP
- **Listening sockets:** Ports that the system is listening on

Active connections help identify C2 communications, lateral movement, and data exfiltration. A process with an active connection to a known malicious IP address is highly suspicious.

### Connection State Analysis

TCP connections have states (ESTABLISHED, TIME_WAIT, CLOSE_WAIT, etc.) that provide context about the connection.

**ESTABLISHED** connections are active and passing data. These are the most important connections for identifying ongoing malicious activity.

**TIME_WAIT** connections are recently closed. These help identify connections that existed before the memory acquisition.

**CLOSE_WAIT** connections are waiting for the local application to close. These may indicate abandoned connections or connections that the malware failed to clean up.

### Socket Analysis

Socket structures in memory reveal the relationship between network connections and processes. Each socket is owned by a process, and the socket structure contains information about the connection.

By correlating socket structures with process information, you can determine which process is responsible for each network connection. This is critical for identifying malware that communicates over the network.

### Network Artifact Extraction

Network artifacts in memory include not just active connections but also DNS caches, routing tables, and ARP caches. These artifacts reveal the system's network history and configuration.

DNS cache entries show recent DNS resolutions, which may include domains that the malware queried. The Windows DNS cache can be extracted from memory using Volatility's `netscan` plugin or by examining the relevant kernel structures.

ARP cache entries map IP addresses to MAC addresses, revealing which systems the compromised host has communicated with on the local network. This is useful for identifying lateral movement targets.

Routing tables show the system's network configuration, including default gateways and static routes. Malware sometimes modifies routing tables to redirect traffic through attacker-controlled infrastructure.

## Real Scenario: Analyzing a Malware Sample via Memory Dump

On a Thursday afternoon, the EDR agent on a developer workstation flagged suspicious activity. The alert indicated that Microsoft Word had spawned a PowerShell process, which then executed a download command. The EDR agent blocked the download, but the Word document remained on the system.

The SOC analyst triaged the alert and classified it as High severity. The analyst suspected that the Word document contained a malicious macro that attempted to download a payload. Even though the download was blocked, the macro may have performed other malicious actions.

The IR team decided to acquire memory from the workstation before shutting it down. The forensic analyst used WinPmem to capture a 16 GB memory dump. The acquisition took approximately 5 minutes.

The memory image was analyzed using Volatility. The analyst started with process analysis:

**Process listing:** The `pslist` plugin showed 87 running processes. The analyst examined the process tree and found that `WINWORD.EXE` had spawned `powershell.exe`, which had spawned `cmd.exe`. This process chain was suspicious: Word should not be spawning command-line processes.

**PowerShell analysis:** The `cmdline` plugin showed that the PowerShell process had executed a command that decoded a Base64-encoded string and attempted to download a file from an external URL. The download was blocked by the EDR agent, but the PowerShell process was still running.

**Process memory analysis:** The analyst used `memmap` to dump the PowerShell process memory. String extraction from the memory dump revealed the decoded Base64 string, which contained a URL to a PHP page on a compromised server. The URL included a parameter that appeared to be a unique identifier for the infected system.

**Network analysis:** The `netscan` plugin showed that the PowerShell process had an established TCP connection to the external URL identified in the memory dump. The connection was in the ESTABLISHED state, indicating active data transfer.

**DLL analysis:** The `dlllist` plugin showed that the PowerShell process had loaded `System.Management.Automation.dll` and `amsi.dll`. The AMSI (Antimalware Scan Interface) DLL is loaded by PowerShell to scan scripts for malware. The fact that the download was blocked suggests that AMSI detected the malicious content.

**Additional findings:** The `netscan` plugin also showed that `WINWORD.EXE` had a listening socket on port 4444. This indicated that the Word document had also attempted to open a reverse shell. The EDR agent had blocked the outbound download but had not blocked the listening socket.

The analyst used `malfind` to examine the PowerShell process for signs of injection. The plugin found a region of executable memory with suspicious content: a sequence of bytes that resembled shellcode.

The memory analysis revealed that the Word document contained a macro that:

1. Decoded a Base64-encoded PowerShell command
2. Attempted to download a payload from an external URL
3. Opened a reverse shell listener on port 4444
4. Attempted to inject shellcode into the PowerShell process

The download and reverse shell were blocked by the EDR agent, but the macro was still active in the Word document. The memory analysis provided a complete picture of the attack that would not have been possible with disk forensics alone.

Key lessons from this analysis:

**Memory forensics reveals live attacker activity.** The active network connections, running processes, and process memory contents showed exactly what the malware was doing at the moment of acquisition.

**Process analysis reveals attack chains.** The parent-child process tree (Word → PowerShell → cmd) clearly showed the attack chain.

**Network analysis reveals attacker infrastructure.** The active connection to the external URL identified the attacker's infrastructure.

**Memory forensics complements disk forensics.** The Word document on disk contained the macro, but the memory analysis revealed the macro's full behavior: including the reverse shell and injection that were not visible on disk.

## Assessment

### Lab Exercise 1: Memory Acquisition Practice (45 minutes)

In a lab environment, practice acquiring memory from a Windows virtual machine.

**Lab Tasks:**

1. Prepare a USB drive with WinPmem (5 minutes)
2. Acquire memory from the Windows VM using WinPmem (15 minutes)
3. Verify the memory image integrity using hash comparison (5 minutes)
4. Identify the operating system and architecture using Volatility (10 minutes)
5. Document the acquisition process (10 minutes)

**Grading Criteria:**

- Correct WinPmem preparation: 10 points
- Successful memory acquisition: 30 points
- Correct integrity verification: 20 points
- Accurate OS identification: 20 points
- Complete documentation: 20 points

### Lab Exercise 2: Process Analysis (60 minutes)

You are given a memory image and must analyze running processes to identify malicious activity.

**Lab Tasks:**

1. List all running processes using `pslist` (10 minutes)
2. Display the process tree using `pstree` (10 minutes)
3. Identify suspicious processes based on process tree anomalies (15 minutes)
4. Analyze suspicious process memory using `memmap` and string extraction (15 minutes)
5. Check for process injection using `malfind` (10 minutes)

**Grading Criteria:**

- Correct process listing: 10 points
- Accurate process tree display: 10 points
- Correct identification of suspicious processes: 30 points
- Thorough process memory analysis: 30 points
- Accurate injection detection: 20 points

### Lab Exercise 3: Network Connection Analysis (45 minutes)

You are given a memory image and must analyze network connections to identify malicious activity.

**Lab Tasks:**

1. Scan for network connections using `netscan` (10 minutes)
2. Identify active connections and their associated processes (15 minutes)
3. Analyze listening sockets for suspicious activity (10 minutes)
4. Correlate network connections with process analysis findings (10 minutes)

**Grading Criteria:**

- Correct network connection scan: 15 points
- Accurate process-connection correlation: 30 points
- Thorough listening socket analysis: 25 points
- Effective correlation across findings: 30 points

## Evidence

### Key Concepts

- **Memory Forensics:** Analysis of RAM contents to extract evidence that exists only while the system is running
- **RAM Acquisition:** Capturing memory contents to a forensic image using tools like WinPmem, LiME, or DumpIt
- **Volatility Framework:** Python-based memory forensics framework with plugins for process, network, registry, and module analysis
- **Process Analysis:** Examining running processes, process trees, process memory, and process injection indicators
- **Network Connections:** Identifying active and historical network connections through socket structures in memory
- **Process Injection:** Technique where malware injects code into legitimate processes: detected through memory protection anomalies and VAD analysis

### Volatility Plugin Quick Reference

| Plugin | Purpose |
|--------|---------|
| `windows.pslist` | List all processes |
| `windows.pstree` | Display process tree |
| `windows.psscan` | Scan for EPROCESS structures |
| `windows.netscan` | Scan for network connections |
| `windows.netstat` | Detailed network activity |
| `windows.dlllist` | List loaded DLLs per process |
| `windows.handles` | List object handles per process |
| `windows.cmdline` | Display command lines |
| `windows.malfind` | Detect process injection |
| `windows.vadinfo` | Display VAD information |
| `windows.memmap` | Memory map per process |
| `windows.procdump` | Dump process memory |
| `windows.registry.hivelist` | List registry hives |
| `windows.registry.printkey` | Display registry keys |

### Memory Forensics Checklist

- [ ] Acquire memory before powering off the system
- [ ] Document system time and state before acquisition
- [ ] Use forensically sound acquisition tools
- [ ] Verify memory image integrity with hashes
- [ ] Identify operating system and architecture
- [ ] List all processes and examine process tree
- [ ] Analyze suspicious process memory
- [ ] Check for process injection indicators
- [ ] Scan for network connections
- [ ] Correlate network connections with processes
- [ ] Extract strings from suspicious processes
- [ ] Document all findings
