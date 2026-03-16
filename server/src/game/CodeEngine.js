/**
 * CodeEngine.js – Generates simple C code files for each player.
 *
 * GAME MECHANICS:
 * ─────────────────────────────────────────────────────────────
 * 1. Each player gets a folder with simple C files (clean functions).
 * 2. Hackers' files contain SUSPICIOUS function names that hint they
 *    are hackers (e.g. exploit_buffer, rootkit_load). The QA
 *    can scan a player's code to see these telltale names.
 * 3. During DAY players can only see THEIR OWN code.
 * 4. During NIGHT:
 *    - Hackers pick a target and corrupt one of the target's files
 *      (insert a subtle bug / malicious line).
 *    - Admin can CHECK if a player's file is corrupted (2 checks/night).
 *      If corrupted, the admin can then FIX it.
 *    - QA can scan a player's file list for hacker-signature
 *      function names. If found → that player is a hacker.
 */

const CONFIG = require('../shared/gameConfig');

/* ═══════════════════════════════════════════════════════════════
 *  C CODE TEMPLATES – clean, readable student-level C functions
 * ═══════════════════════════════════════════════════════════════ */

const CLEAN_C_FILES = [
  {
    key: 'while_loop',
    name: 'while_loop.c',
    desc: 'While Loop',
    code: `// While Loop
#include <stdio.h>

void broadcast_emergency_signal(int *alert_counter, int target_alerts) {
    while (*alert_counter < target_alerts) {
        printf("\u{1F6A8} [EMERGENCY]: SYSTEM BREACH DETECTED! BROADCASTING ALERT to IEEE Members...\\n");
        (*alert_counter)++;
    }
}

int main() {
    int current_alerts = 0;
    int target_alerts = 3;

    broadcast_emergency_signal(&current_alerts, target_alerts);
    printf("\\nFinished! Total alerts broadcasted: %d\\n", current_alerts);

    return 0;
}`,
  },
  {
    key: 'string_reversal',
    name: 'string_reversal.c',
    desc: 'String Reversal',
    code: `// String Reversal
#include <stdio.h>
#include <string.h>

void decrypt_intercepted_message(char *encrypted_msg) {
    int left = 0;
    int right = strlen(encrypted_msg) - 1;
    char temp;
    
    while (left < right) {
        temp = encrypted_msg[left];
        encrypted_msg[left] = encrypted_msg[right];
        encrypted_msg[right] = temp;
        left++;
        right--;
    }
}

int main() {
    char encrypted_msg[] = "Birzeit";
    decrypt_intercepted_message(encrypted_msg);
    printf("Decrypted Message: %s\\n", encrypted_msg);
    return 0;
}`,
  },
  {
    key: 'prime_checker',
    name: 'prime_checker.c',
    desc: 'Prime Number Checker',
    code: `// Prime Number Checker
#include <stdio.h>

int validate_rsa_key(int rsa_key) {
    if (rsa_key <= 1)
       return 0;

    for (int i = 2; i * i <= rsa_key; i++) {
        if (rsa_key % i == 0)
            return 0;
    }
    return 1;
}

int main() {
    int key_value = 29;

    if (validate_rsa_key(key_value)) {
        printf("RSA Key %d is VALID. Secure connection established.\\n", key_value);
    } else {
        printf("RSA Key %d is COMPROMISED. Connection terminated.\\n", key_value);
    }
    return 0;
}`,
  },
  {
    key: 'perfect_number',
    name: 'perfect_number.c',
    desc: 'Perfect Number Checker',
    code: `// Perfect Number Checker
#include <stdio.h>

int verify_system_integrity(int system_id) {
    int integrity_score = 0;
    for (int i = 1; i <= system_id / 2; i++) {
        if (system_id % i == 0) {
            integrity_score += i;
        }
    }
    return (integrity_score == system_id);
}

int main() {
    int system_id = 28;
    
    if (verify_system_integrity(system_id)) {
        printf("System core %d is PERFECT. Integrity verified.\\n", system_id);
    } else {
        printf("System core %d is CORRUPTED. Integrity failed.\\n", system_id);
    }
    return 0;
}`,
  },
  {
    key: 'max_element',
    name: 'max_element.c',
    desc: 'Finding the Maximum Element in an Array',
    code: `// Finding the Maximum Element in an Array
#include <stdio.h>

int identify_main_target(int network_nodes[], int node_count) {
    int max_threat = network_nodes[0];
    for (int i = 1; i < node_count; i++) {
        if (network_nodes[i] > max_threat) {
            max_threat = network_nodes[i];
        }
    }
    return max_threat;
}

int main() {
    int network_nodes[] = {12, 45, 7, 89, 23};
    int node_count = sizeof(network_nodes) / sizeof(network_nodes[0]);
    printf("CRITICAL: The highest threat node is: %d\\n", identify_main_target(network_nodes, node_count));
    return 0;
}`,
  },
  {
    key: 'factorial',
    name: 'factorial.c',
    desc: 'Factorial',
    code: `// Factorial
#include <stdio.h>

long long calculate_encryption_combinations(int key_length) {
    long long combinations = 1;
    for (int i = 1; i <= key_length; i++) {
        combinations *= i;
    }
    return combinations;
}

int main() {
    int key_length = 5;
    printf("Total combinations for key length %d = %lld\\n", key_length, calculate_encryption_combinations(key_length));
    return 0;
}`,
  },
  {
    key: 'decimal_to_binary',
    name: 'decimal_to_binary.c',
    desc: 'Decimal to Binary Conversion',
    code: `// Decimal to Binary Conversion
#include <stdio.h>

void encrypt_to_binary(int data_packet) {
    int binary_stream[32];
    int i = 0;
    if (data_packet == 0) {
        printf("Encrypted Stream: 0\\n");
        return;
    }

    while (data_packet > 0) {
        binary_stream[i] = data_packet % 2;
        data_packet = data_packet / 2;
        i++;
    }

    printf("Encrypted Binary Stream: ");
    for (int j = i - 1; j >= 0; j--) {
        printf("%d", binary_stream[j]);
    }
    printf("\\n");
}

int main() {
    int packet = 17;
    encrypt_to_binary(packet);
    return 0;
}`,
  },
  {
    key: 'bubble_sort',
    name: 'bubble_sort.c',
    desc: 'Bubble Sort',
    code: `// Bubble Sort
#include <stdio.h>

void sort_threat_levels(int threats[], int size) {
    for (int i = 0; i < size - 1; i++) {
        for (int j = 0; j < size - i - 1; j++) {
            if (threats[j] > threats[j + 1]) {
                int temp = threats[j];
                threats[j] = threats[j + 1];
                threats[j + 1] = temp;
            }
        }
    }
}

int main() {
    int threats[] = {64, 34, 25, 12, 22, 11, 90};
    int size = 7;

    sort_threat_levels(threats, size);
    
    printf("Threat levels prioritized: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", threats[i]);
    }
    printf("\\n");

    return 0;
}`,
  },
];

/* ═══════════════════════════════════════════════════════════════
 *  HACKER SIGNATURE FILES — contain suspicious function names
 *  that the QA can detect.
 * ═══════════════════════════════════════════════════════════════ */

const HACKER_SIGNATURE_FILES = [
  {
    name: 'network_utils.c',
    code: `#include <stdio.h>
#include <string.h>

/* Opens a raw socket and sends a packet. */
int exploit_buffer(char *target, int port) {
    char payload[256];
    memset(payload, 0x41, sizeof(payload));
    printf("Sending payload to %s:%d\\n", target, port);
    return 0;
}

/* Performs a simple ping check. */
int ping_host(const char *host) {
    printf("Pinging %s ...\\n", host);
    return 1;
}

int main() {
    ping_host("192.168.1.1");
    return 0;
}`,
    suspiciousFunctions: ['exploit_buffer'],
  },
  {
    name: 'sys_helper.c',
    code: `#include <stdio.h>
#include <stdlib.h>

/* Loads a kernel module from a path. */
int rootkit_load(const char *module_path) {
    printf("Loading module: %s\\n", module_path);
    return system(module_path);
}

/* Gets the current system uptime. */
int get_uptime() {
    FILE *fp = fopen("/proc/uptime", "r");
    if (!fp) return -1;
    int uptime;
    fscanf(fp, "%d", &uptime);
    fclose(fp);
    return uptime;
}

int main() {
    printf("Uptime: %d seconds\\n", get_uptime());
    return 0;
}`,
    suspiciousFunctions: ['rootkit_load'],
  },
  {
    name: 'crypto_tool.c',
    code: `#include <stdio.h>
#include <string.h>

/* XOR encrypt/decrypt a buffer with a key. */
void xor_cipher(char *data, int len, char key) {
    for (int i = 0; i < len; i++) {
        data[i] ^= key;
    }
}

/* Installs a backdoor listener on the given port. */
int backdoor_connect(int port) {
    printf("Listening on port %d\\n", port);
    return 0;
}

int main() {
    char msg[] = "secret";
    xor_cipher(msg, strlen(msg), 0x42);
    printf("Encrypted: %s\\n", msg);
    xor_cipher(msg, strlen(msg), 0x42);
    printf("Decrypted: %s\\n", msg);
    return 0;
}`,
    suspiciousFunctions: ['backdoor_connect'],
  },
  {
    name: 'memory_mgr.c',
    code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Allocates and zeroes a block of memory. */
void *safe_alloc(size_t size) {
    void *ptr = malloc(size);
    if (ptr) memset(ptr, 0, size);
    return ptr;
}

/* Injects shellcode into a memory region. */
int inject_shellcode(void *addr, const char *code, int len) {
    memcpy(addr, code, len);
    printf("Payload written at %p\\n", addr);
    return 0;
}

/* Frees memory safely and nulls the pointer. */
void safe_free(void **ptr) {
    if (ptr && *ptr) {
        free(*ptr);
        *ptr = NULL;
    }
}

int main() {
    char *buf = (char *)safe_alloc(64);
    printf("Allocated: %p\\n", buf);
    safe_free((void **)&buf);
    return 0;
}`,
    suspiciousFunctions: ['inject_shellcode'],
  },
  {
    name: 'process_mgr.c',
    code: `#include <stdio.h>
#include <stdlib.h>

/* Spawns a hidden daemon process. */
int spawn_daemon(const char *cmd) {
    printf("Spawning: %s\\n", cmd);
    return system(cmd);
}

/* Reads the contents of /etc/shadow (password hashes). */
int steal_credentials(char *buffer, int maxlen) {
    FILE *fp = fopen("/etc/shadow", "r");
    if (!fp) return -1;
    int n = fread(buffer, 1, maxlen, fp);
    fclose(fp);
    return n;
}

/* Checks if a process is running by PID. */
int is_running(int pid) {
    char path[64];
    sprintf(path, "/proc/%d/status", pid);
    FILE *fp = fopen(path, "r");
    if (!fp) return 0;
    fclose(fp);
    return 1;
}

int main() {
    printf("PID 1 running? %d\\n", is_running(1));
    return 0;
}`,
    suspiciousFunctions: ['spawn_daemon', 'steal_credentials'],
  },
  {
    name: 'data_logger.c',
    code: `#include <stdio.h>
#include <time.h>

/* Logs a key press to a hidden file. */
int keylogger_record(char key) {
    FILE *fp = fopen("/tmp/.keylog", "a");
    if (!fp) return -1;
    fprintf(fp, "[%ld] %c\\n", time(NULL), key);
    fclose(fp);
    return 0;
}

/* Gets the current timestamp as a string. */
void get_timestamp(char *buf, int size) {
    time_t now = time(NULL);
    strftime(buf, size, "%Y-%m-%d %H:%M:%S", localtime(&now));
}

int main() {
    char ts[64];
    get_timestamp(ts, sizeof(ts));
    printf("Now: %s\\n", ts);
    return 0;
}`,
    suspiciousFunctions: ['keylogger_record'],
  },
];

/* ═══════════════════════════════════════════════════════════════
 *  CORRUPTION TEMPLATES – bugs a hacker injects into a victim's
 *  clean file during the night.  Each is a { find, replace }
 *  pair that introduces a subtle bug.
 * ═══════════════════════════════════════════════════════════════ */

const CORRUPTION_PATCHES = {
  while_loop: [
    { find: '(*alert_counter)++;', replace: '(*alert_counter)--;', desc: 'INFINITE LOOP — counter decreases instead of increasing' },
    { find: 'while (*alert_counter < target_alerts)', replace: 'while (*alert_counter <= target_alerts)', desc: 'OFF-BY-ONE ERROR — extra alert broadcasted' },
    { find: 'int *alert_counter', replace: 'int *alert_counter_invalid', desc: 'NULL POINTER CRASH — invalid pointer passed' },
    { find: '(*alert_counter)++;', replace: '(*alert_counter) += 2;', desc: 'SKIPPED ALERTS — counter increments by 2' },
    { find: '*alert_counter < target_alerts', replace: '*alert_counter > target_alerts', desc: 'WRONG CONDITION — loop never executes' },
  ],
  string_reversal: [
    { find: 'int right = strlen(encrypted_msg) - 1;', replace: 'int right = strlen(encrypted_msg);', desc: 'BUFFER OVERFLOW — accesses memory beyond the string' },
    { find: 'left++;', replace: 'left--;', desc: 'INFINITE LOOP — left index goes backward' },
    { find: 'encrypted_msg[right] = temp;', replace: 'encrypted_msg[right] = encrypted_msg[right];', desc: 'SILENT BUG — assigns same value, string unchanged' },
    { find: 'while (left < right)', replace: 'while (left != right)', desc: 'SKIPS MIDDLE — misses swap when indices cross' },
    { find: 'right--;', replace: 'right++;', desc: 'CRASH — right index goes out of bounds' },
  ],
  prime_checker: [
    { find: 'if (rsa_key <= 1)', replace: 'if (rsa_key <= 100)', desc: 'WRONG RESULT — rejects all keys ≤ 100 as invalid' },
    { find: 'rsa_key % i == 0', replace: 'rsa_key % i != 0', desc: 'INVERTED LOGIC — non-primes pass, primes fail' },
    { find: 'return 1;', replace: 'return 0;', desc: 'ALWAYS FAILS — valid keys reported as compromised' },
    { find: 'i * i <= rsa_key', replace: 'i <= rsa_key', desc: 'PERFORMANCE KILL — checks every number up to N' },
    { find: 'for (int i = 2;', replace: 'for (int i = 0;', desc: 'DIVISION BY ZERO — starts loop at i=0' },
  ],
  perfect_number: [
    { find: 'integrity_score += i;', replace: 'integrity_score -= i;', desc: 'WRONG RESULT — subtracts divisors instead of adding' },
    { find: 'return (integrity_score == system_id);', replace: 'return (integrity_score != system_id);', desc: 'INVERTED RESULT — perfect numbers fail, non-perfect pass' },
    { find: 'for (int i = 1; i <= system_id / 2; i++)', replace: 'for (int i = 1; i <= system_id; i++)', desc: 'WRONG LOGIC — includes number itself in sum' },
    { find: 'int integrity_score = 0;', replace: 'int integrity_score = 1;', desc: 'OFF-BY-ONE — score starts at 1 instead of 0' },
    { find: 'system_id % i == 0', replace: 'system_id % i != 0', desc: 'INVERTED CHECK — adds non-divisors instead of divisors' },
  ],
  max_element: [
    { find: 'if (network_nodes[i] > max_threat)', replace: 'if (network_nodes[i] < max_threat)', desc: 'WRONG RESULT — finds MINIMUM instead of maximum' },
    { find: 'int max_threat = network_nodes[0];', replace: 'int max_threat = 0;', desc: 'WRONG INIT — starts at 0, fails for negative arrays' },
    { find: 'for (int i = 1; i < node_count; i++)', replace: 'for (int i = 0; i < node_count - 1; i++)', desc: 'SKIPS LAST — never checks last element' },
    { find: 'max_threat = network_nodes[i];', replace: 'max_threat = i;', desc: 'RETURNS INDEX — saves index instead of value' },
    { find: 'return max_threat;', replace: 'return network_nodes[0];', desc: 'ALWAYS FIRST — always returns first element' },
  ],
  factorial: [
    { find: 'long long combinations = 1;', replace: 'long long combinations = 0;', desc: 'ALWAYS ZERO — multiplying by 0 gives 0 forever' },
    { find: 'combinations *= i;', replace: 'combinations += i;', desc: 'WRONG OPERATION — sums instead of multiplying' },
    { find: 'for (int i = 1; i <= key_length; i++)', replace: 'for (int i = 0; i <= key_length; i++)', desc: 'ALWAYS ZERO — starts from 0, result is always 0' },
    { find: 'i <= key_length', replace: 'i < key_length', desc: 'OFF-BY-ONE — misses last multiplication' },
    { find: 'combinations *= i;', replace: 'combinations *= key_length;', desc: 'WRONG RESULT — multiplies by same number every time' },
  ],
  decimal_to_binary: [
    { find: 'data_packet = data_packet / 2;', replace: 'data_packet = data_packet * 2;', desc: 'INFINITE LOOP — multiplies instead of dividing' },
    { find: 'data_packet % 2', replace: 'data_packet % 10', desc: 'WRONG BASE — uses mod 10 instead of mod 2' },
    { find: 'for (int j = i - 1; j >= 0; j--)', replace: 'for (int j = 0; j < i; j++)', desc: 'REVERSED OUTPUT — prints binary in wrong order' },
    { find: 'data_packet > 0', replace: 'data_packet >= 0', desc: 'INFINITE LOOP — condition includes 0, never stops' },
    { find: 'int binary_stream[32];', replace: 'int binary_stream[2];', desc: 'BUFFER OVERFLOW — array too small for most numbers' },
  ],
  bubble_sort: [
    { find: 'threats[j] > threats[j + 1]', replace: 'threats[j] < threats[j + 1]', desc: 'WRONG ORDER — sorts descending instead of ascending' },
    { find: 'threats[j] = threats[j + 1];', replace: 'threats[j] = threats[j];', desc: 'SILENT BUG — copies to itself, sort does nothing' },
    { find: 'int temp = threats[j];', replace: 'int temp = threats[j + 1];', desc: 'DATA LOSS — wrong value saved, duplicates appear' },
    { find: 'j < size - i - 1', replace: 'j < size - 1', desc: 'SLOW SORT — redundant comparisons every pass' },
    { find: 'threats[j + 1] = temp;', replace: 'threats[j] = temp;', desc: 'SWAP BROKEN — overwrites wrong position' },
  ],
};


class CodeEngine {
  /* ── Fisher-Yates shuffle ── */
  static shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Generate code files for every player at game start.
   *
   * @param {Player[]} players
   * @returns {Map<string, object>} playerId → player code entry
   */
  static generateCodeFiles(players) {
    const codeStore = new Map();
    const shuffledClean = CodeEngine.shuffle([...CLEAN_C_FILES]);
    const shuffledSig   = CodeEngine.shuffle([...HACKER_SIGNATURE_FILES]);

    let cleanIdx = 0;
    let sigIdx   = 0;

    for (const player of players) {
      // Each player gets exactly ONE file named <playerName>.c
      const playerFileName = player.name.replace(/\s+/g, '_') + '.c';

      const files = [];

      // Pick one clean code template
      const tpl = shuffledClean[cleanIdx % shuffledClean.length];
      cleanIdx++;
      files.push({
        name: playerFileName,
        code: tpl.code,
        original: tpl.code,
        isClean: true,
        templateKey: tpl.key,
        suspiciousFunctions: [],
      });

      // Hackers get hacker-signature functions injected into their file
      if (player.isHacker()) {
        const sig = shuffledSig[sigIdx % shuffledSig.length];
        sigIdx++;
        // Append suspicious function names to the player's file metadata
        files[0].suspiciousFunctions = sig.suspiciousFunctions;
        // Append the suspicious code at the end of the player's file
        files[0].code += '\n\n' + sig.code;
        files[0].original = files[0].code;
        files[0].isClean = false;
      }

      codeStore.set(player.id, {
        playerName: player.name,
        files,
        infected: false,
        corruptedFileIdx: null,
        originalCode: null,
        corruptionPatch: null,
      });
    }

    return codeStore;
  }

  /* ═══════════════════════════════════════════
   *  HACKER: get available injections for a target
   * ═══════════════════════════════════════════ */
  static getInjectionOptions(codeStore, targetId) {
    const entry = codeStore.get(targetId);
    if (!entry) return [];
    if (entry.infected) return [];

    const result = [];
    for (let fi = 0; fi < entry.files.length; fi++) {
      const file = entry.files[fi];
      // TEMP: skip isClean check so hacker files also show options for testing
      // if (!file.isClean) continue;

      // Look up patches by templateKey
      const templatePatches = CORRUPTION_PATCHES[file.templateKey] || [];
      const applicable = [];
      for (let pi = 0; pi < templatePatches.length; pi++) {
        if (file.code.includes(templatePatches[pi].find)) {
          applicable.push({ patchIdx: pi, desc: templatePatches[pi].desc });
        }
      }
      if (applicable.length > 0) {
        result.push({ fileIdx: fi, fileName: file.name, patches: applicable });
      }
    }
    console.log('[INJECT-DEBUG] Total options for', targetId, ':', result.length, 'files with', result.reduce((s, r) => s + r.patches.length, 0), 'patches');
    return result;
  }

  /* ═══════════════════════════════════════════
   *  HACKER ACTION: inject a specific corruption
   * ═══════════════════════════════════════════ */
  static injectCorruption(codeStore, targetId, fileIdx, patchIdx) {
    const entry = codeStore.get(targetId);
    if (!entry) return { success: false, reason: 'player_not_found' };
    if (entry.infected) return { success: false, reason: 'already_corrupted' };

    const file = entry.files[fileIdx];
    if (!file || !file.isClean) return { success: false, reason: 'invalid_file' };

    const templatePatches = CORRUPTION_PATCHES[file.templateKey] || [];
    const patch = templatePatches[patchIdx];
    if (!patch) return { success: false, reason: 'invalid_patch' };
    if (!file.code.includes(patch.find)) return { success: false, reason: 'patch_not_applicable' };

    entry.originalCode = file.code;
    entry.corruptedFileIdx = fileIdx;
    entry.corruptionPatch = patch;
    file.code = file.code.replace(patch.find, patch.replace);
    entry.infected = true;
    return { success: true, fileName: file.name, desc: patch.desc };
  }

  /* ═══════════════════════════════════════════
   *  LEGACY: auto-corrupt (kept for fallback)
   * ═══════════════════════════════════════════ */
  static corruptFile(codeStore, targetId) {
    const entry = codeStore.get(targetId);
    if (!entry) return { success: false };
    if (entry.infected) return { success: false, reason: 'already_corrupted' };

    const cleanFiles = entry.files.filter(f => f.isClean);

    for (const file of CodeEngine.shuffle([...cleanFiles])) {
      const templatePatches = CORRUPTION_PATCHES[file.templateKey] || [];
      const shuffledPatches = CodeEngine.shuffle([...templatePatches]);
      for (const patch of shuffledPatches) {
        if (file.code.includes(patch.find)) {
          entry.originalCode = file.code;
          entry.corruptedFileIdx = entry.files.indexOf(file);
          entry.corruptionPatch = patch;
          file.code = file.code.replace(patch.find, patch.replace);
          entry.infected = true;
          return { success: true, fileName: file.name, patch };
        }
      }
    }

    return { success: false, reason: 'no_applicable_patch' };
  }

  /**
   * Admin scans a specific player and returns corruption details.
   * If corrupted, also returns the code so the admin can inspect it.
   * If clean, returns corrupted: false so client blocks code view.
   *
   * IMPORTANT: The admin is NOT told what injection was applied.
   * Instead, they see the corrupted code and multiple fix options
   * (one correct + several decoys from the same template's patch pool).
   */
  static getCorruptionDetails(codeStore, targetId) {
    const entry = codeStore.get(targetId);
    if (!entry) return { corrupted: false, reason: 'player_not_found' };

    if (!entry.infected) {
      return { corrupted: false, playerName: entry.playerName };
    }

    // Return only the corrupted file so admin reviews the exact damaged code
    const corruptedFile = entry.files[entry.corruptedFileIdx];
    const templateKey = corruptedFile?.templateKey;
    const allPatches = CORRUPTION_PATCHES[templateKey] || [];
    const appliedPatch = entry.corruptionPatch;

    // Build fix options from ALL patches of the same template.
    // The correct fix reverses the applied patch; decoy fixes describe
    // other possible patches (wrong choices).
    const fixOptions = [];
    let correctFixIndex = -1;

    for (let i = 0; i < allPatches.length; i++) {
      const patch = allPatches[i];
      // The correct fix: revert the applied patch (replace → find)
      const isCorrect = patch.find === appliedPatch?.find && patch.replace === appliedPatch?.replace;
      if (isCorrect) {
        correctFixIndex = fixOptions.length;
        // Correct fix: replace the corrupted code with the original
        fixOptions.push({
          fixIndex: fixOptions.length,
          label: `Replace \`${patch.replace}\` with \`${patch.find}\``,
        });
      } else {
        // Decoy fix: suggests changing the original code (patch.find is in the file)
        // to the corrupted version (patch.replace), which would introduce ANOTHER bug.
        // Framed as a "fix" so it looks plausible to the admin.
        fixOptions.push({
          fixIndex: fixOptions.length,
          label: `Replace \`${patch.find}\` with \`${patch.replace}\``,
        });
      }
    }

    // Shuffle fix options but track the correct index
    const shuffled = CodeEngine._shuffleWithTracking(fixOptions, correctFixIndex);

    return {
      corrupted: true,
      playerName: entry.playerName,
      fileIdx: 0,
      fileName: corruptedFile?.name,
      files: corruptedFile ? [{ name: corruptedFile.name, code: corruptedFile.code }] : [],
      fixOptions: shuffled.items,
      correctFixIndex: shuffled.trackedIndex,
    };
  }

  /**
   * Shuffle an array and track where a specific index ends up.
   */
  static _shuffleWithTracking(arr, trackedIndex) {
    const items = arr.map((item, i) => ({ ...item, _origIdx: i }));
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    let newTrackedIndex = -1;
    for (let i = 0; i < items.length; i++) {
      if (items[i]._origIdx === trackedIndex) {
        newTrackedIndex = i;
      }
      items[i].fixIndex = i;
      delete items[i]._origIdx;
    }
    return { items, trackedIndex: newTrackedIndex };
  }

  /**
   * Admin attempts to fix corruption by choosing a fix option.
   * @param {Map} codeStore
   * @param {string} targetId
   * @param {number} fixIndex - the fix option the admin chose
   * @param {number} correctFixIndex - the correct fix index (from getCorruptionDetails)
   * @returns {{ success: boolean, correct: boolean, wasCorrupted: boolean, fileName?: string }}
   */
  static attemptRepair(codeStore, targetId, fixIndex, correctFixIndex) {
    const entry = codeStore.get(targetId);
    if (!entry) return { success: false, correct: false, wasCorrupted: false };
    if (!entry.infected) return { success: true, correct: true, wasCorrupted: false };

    if (fixIndex === correctFixIndex) {
      // Correct fix — revert the code
      const file = entry.files[entry.corruptedFileIdx];
      if (file && entry.originalCode) {
        file.code = entry.originalCode;
      }
      const fileName = file?.name;
      entry.infected = false;
      entry.corruptedFileIdx = null;
      entry.originalCode = null;
      entry.corruptionPatch = null;
      return { success: true, correct: true, wasCorrupted: true, fileName };
    } else {
      // Wrong fix — the target player will be eliminated
      return { success: true, correct: false, wasCorrupted: true };
    }
  }

  /**
   * Admin fixes (reverts) corruption in a player's code.
   * @deprecated Use attemptRepair instead for fix-option gameplay
   */
  static repairCorruption(codeStore, targetId) {
    const entry = codeStore.get(targetId);
    if (!entry) return { success: false, wasCorrupted: false };

    if (!entry.infected) {
      return { success: true, wasCorrupted: false };
    }

    const file = entry.files[entry.corruptedFileIdx];
    if (file && entry.originalCode) {
      file.code = entry.originalCode;
    }
    const fileName = file?.name;
    entry.infected = false;
    entry.corruptedFileIdx = null;
    entry.originalCode = null;
    entry.corruptionPatch = null;

    return { success: true, wasCorrupted: true, fileName };
  }

  /* ═══════════════════════════════════════════
   *  QA ACTION: scan for hacker signatures
   * ═══════════════════════════════════════════ */
  static scanForHackerSignatures(codeStore, targetId) {
    const entry = codeStore.get(targetId);
    if (!entry) return { suspicious: false, suspiciousFunctions: [] };

    const found = [];
    let suspiciousFile = null;

    for (const file of entry.files) {
      if (file.suspiciousFunctions && file.suspiciousFunctions.length > 0) {
        found.push(...file.suspiciousFunctions);
        suspiciousFile = file.name;
      }
    }

    return {
      suspicious: found.length > 0,
      suspiciousFunctions: found,
      suspiciousFile,
    };
  }

  /* ═══════════════════════════════════════════
   *  VIEW HELPERS
   * ═══════════════════════════════════════════ */

  /** Get a single player's own code (day view – no metadata). */
  static getOwnCode(codeStore, playerId) {
    const entry = codeStore.get(playerId);
    if (!entry) return null;
    return {
      playerName: entry.playerName,
      files: entry.files.map(f => ({ name: f.name, code: f.code })),
    };
  }

  /** Alias used for night-time viewing of a target's code. */
  static getPlayerCode(codeStore, playerId) {
    return CodeEngine.getOwnCode(codeStore, playerId);
  }

  /** Build per-player payloads (each player gets only their own code). */
  static getPerPlayerCode(codeStore) {
    const result = {};
    for (const [playerId] of codeStore.entries()) {
      result[playerId] = CodeEngine.getOwnCode(codeStore, playerId);
    }
    return result;
  }

  /** Get all code for all players (admin dashboard, etc.). */
  static getAllCode(codeStore) {
    const result = {};
    for (const [playerId, data] of codeStore.entries()) {
      result[playerId] = {
        playerName: data.playerName,
        files: data.files.map(f => ({ name: f.name, code: f.code })),
      };
    }
    return result;
  }
}

module.exports = CodeEngine;
