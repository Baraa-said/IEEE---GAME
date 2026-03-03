/**
 * CodeEngine.js – Generates simple C code files for each player.
 *
 * GAME MECHANICS:
 * ─────────────────────────────────────────────────────────────
 * 1. Each player gets a folder with simple C files (clean functions).
 * 2. Hackers' files contain SUSPICIOUS function names that hint they
 *    are hackers (e.g. exploit_buffer, rootkit_load). The Security Lead
 *    can scan a player's code to see these telltale names.
 * 3. During DAY players can only see THEIR OWN code.
 * 4. During NIGHT:
 *    - Hackers pick a target and corrupt one of the target's files
 *      (insert a subtle bug / malicious line).
 *    - Admin can CHECK if a player's file is corrupted (2 checks/night).
 *      If corrupted, the admin can then FIX it.
 *    - Security Lead can scan a player's file list for hacker-signature
 *      function names. If found → that player is a hacker.
 */

const CONFIG = require('../shared/gameConfig');

/* ═══════════════════════════════════════════════════════════════
 *  C CODE TEMPLATES – clean, readable student-level C functions
 * ═══════════════════════════════════════════════════════════════ */

const CLEAN_C_FILES = [
  {
    name: 'math_utils.c',
    code: `#include <stdio.h>

/* Returns the factorial of n (iterative). */
int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

/* Returns 1 if n is prime, 0 otherwise. */
int is_prime(int n) {
    if (n < 2) return 0;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return 0;
    }
    return 1;
}

int main() {
    printf("5! = %d\\n", factorial(5));
    printf("7 is prime? %d\\n", is_prime(7));
    return 0;
}`,
  },
  {
    name: 'string_ops.c',
    code: `#include <stdio.h>
#include <string.h>

/* Reverses a string in-place. */
void reverse_string(char *str) {
    int len = strlen(str);
    for (int i = 0; i < len / 2; i++) {
        char tmp = str[i];
        str[i] = str[len - 1 - i];
        str[len - 1 - i] = tmp;
    }
}

/* Counts occurrences of character c in str. */
int count_char(const char *str, char c) {
    int count = 0;
    while (*str) {
        if (*str == c) count++;
        str++;
    }
    return count;
}

int main() {
    char word[] = "hello";
    reverse_string(word);
    printf("Reversed: %s\\n", word);
    printf("Count of 'l': %d\\n", count_char("hello", 'l'));
    return 0;
}`,
  },
  {
    name: 'array_sort.c',
    code: `#include <stdio.h>

/* Bubble sort – sorts arr[] of size n in ascending order. */
void bubble_sort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
            }
        }
    }
}

/* Prints an array. */
void print_array(int arr[], int n) {
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
}

int main() {
    int data[] = {5, 3, 8, 1, 2};
    int n = sizeof(data) / sizeof(data[0]);
    bubble_sort(data, n);
    print_array(data, n);
    return 0;
}`,
  },
  {
    name: 'linked_list.c',
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;

/* Create a new node with given value. */
Node *create_node(int value) {
    Node *node = (Node *)malloc(sizeof(Node));
    node->data = value;
    node->next = NULL;
    return node;
}

/* Append a value to the end of the list. */
void append(Node **head, int value) {
    Node *new_node = create_node(value);
    if (*head == NULL) {
        *head = new_node;
        return;
    }
    Node *current = *head;
    while (current->next != NULL) {
        current = current->next;
    }
    current->next = new_node;
}

/* Print all elements. */
void print_list(Node *head) {
    while (head != NULL) {
        printf("%d -> ", head->data);
        head = head->next;
    }
    printf("NULL\\n");
}

int main() {
    Node *head = NULL;
    append(&head, 10);
    append(&head, 20);
    append(&head, 30);
    print_list(head);
    return 0;
}`,
  },
  {
    name: 'file_io.c',
    code: `#include <stdio.h>

/* Counts the number of lines in a text file. */
int count_lines(const char *filename) {
    FILE *fp = fopen(filename, "r");
    if (fp == NULL) return -1;
    int lines = 0;
    char ch;
    while ((ch = fgetc(fp)) != EOF) {
        if (ch == '\\n') lines++;
    }
    fclose(fp);
    return lines;
}

/* Copies content from src file to dst file. */
int copy_file(const char *src, const char *dst) {
    FILE *in = fopen(src, "r");
    FILE *out = fopen(dst, "w");
    if (!in || !out) return -1;
    char ch;
    while ((ch = fgetc(in)) != EOF) {
        fputc(ch, out);
    }
    fclose(in);
    fclose(out);
    return 0;
}

int main() {
    printf("Lines: %d\\n", count_lines("file_io.c"));
    return 0;
}`,
  },
  {
    name: 'calculator.c',
    code: `#include <stdio.h>

/* Adds two integers. */
int add(int a, int b) {
    return a + b;
}

/* Subtracts b from a. */
int subtract(int a, int b) {
    return a - b;
}

/* Multiplies two integers. */
int multiply(int a, int b) {
    return a * b;
}

/* Divides a by b. Returns 0 if b is zero. */
int divide(int a, int b) {
    if (b == 0) return 0;
    return a / b;
}

int main() {
    int x = 10, y = 3;
    printf("Add:      %d\\n", add(x, y));
    printf("Subtract: %d\\n", subtract(x, y));
    printf("Multiply: %d\\n", multiply(x, y));
    printf("Divide:   %d\\n", divide(x, y));
    return 0;
}`,
  },
  {
    name: 'stack.c',
    code: `#include <stdio.h>
#include <stdlib.h>

#define MAX_SIZE 100

typedef struct {
    int items[MAX_SIZE];
    int top;
} Stack;

void stack_init(Stack *s) {
    s->top = -1;
}

int stack_push(Stack *s, int value) {
    if (s->top >= MAX_SIZE - 1) return -1;
    s->items[++(s->top)] = value;
    return 0;
}

int stack_pop(Stack *s) {
    if (s->top < 0) return -1;
    return s->items[(s->top)--];
}

int stack_peek(Stack *s) {
    if (s->top < 0) return -1;
    return s->items[s->top];
}

int main() {
    Stack s;
    stack_init(&s);
    stack_push(&s, 10);
    stack_push(&s, 20);
    printf("Top: %d\\n", stack_peek(&s));
    printf("Pop: %d\\n", stack_pop(&s));
    return 0;
}`,
  },
  {
    name: 'matrix.c',
    code: `#include <stdio.h>

#define ROWS 3
#define COLS 3

/* Multiplies two 3x3 matrices and stores result in C. */
void matrix_multiply(int A[ROWS][COLS], int B[ROWS][COLS], int C[ROWS][COLS]) {
    for (int i = 0; i < ROWS; i++) {
        for (int j = 0; j < COLS; j++) {
            C[i][j] = 0;
            for (int k = 0; k < COLS; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }
}

/* Prints a 3x3 matrix. */
void print_matrix(int M[ROWS][COLS]) {
    for (int i = 0; i < ROWS; i++) {
        for (int j = 0; j < COLS; j++) {
            printf("%4d ", M[i][j]);
        }
        printf("\\n");
    }
}

int main() {
    int A[3][3] = {{1,2,3},{4,5,6},{7,8,9}};
    int B[3][3] = {{9,8,7},{6,5,4},{3,2,1}};
    int C[3][3];
    matrix_multiply(A, B, C);
    print_matrix(C);
    return 0;
}`,
  },
  {
    name: 'search.c',
    code: `#include <stdio.h>

/* Linear search – returns index or -1. */
int linear_search(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}

/* Binary search – arr must be sorted. Returns index or -1. */
int binary_search(int arr[], int n, int target) {
    int low = 0, high = n - 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main() {
    int data[] = {1, 3, 5, 7, 9, 11};
    int n = 6;
    printf("Linear  (7): index %d\\n", linear_search(data, n, 7));
    printf("Binary (11): index %d\\n", binary_search(data, n, 11));
    return 0;
}`,
  },
  {
    name: 'temperature.c',
    code: `#include <stdio.h>

/* Converts Celsius to Fahrenheit. */
float celsius_to_fahrenheit(float c) {
    return (c * 9.0 / 5.0) + 32.0;
}

/* Converts Fahrenheit to Celsius. */
float fahrenheit_to_celsius(float f) {
    return (f - 32.0) * 5.0 / 9.0;
}

/* Returns the average of an array of floats. */
float average(float arr[], int n) {
    float sum = 0;
    for (int i = 0; i < n; i++) {
        sum += arr[i];
    }
    return sum / n;
}

int main() {
    printf("100C = %.1fF\\n", celsius_to_fahrenheit(100));
    printf("212F = %.1fC\\n", fahrenheit_to_celsius(212));
    float temps[] = {20.0, 22.5, 19.0, 25.0};
    printf("Avg: %.1f\\n", average(temps, 4));
    return 0;
}`,
  },
];

/* ═══════════════════════════════════════════════════════════════
 *  HACKER SIGNATURE FILES — contain suspicious function names
 *  that the Security Lead can detect.
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

const CORRUPTION_PATCHES = [
  /* ── OBVIOUS RUNTIME ERRORS ── easy to spot when reading code ── */
  // math_utils.c: infinite loop — i-- instead of i++ in factorial
  { find: 'for (int i = 2; i <= n; i++) {', replace: 'for (int i = 2; i <= n; i--) {', desc: 'INFINITE LOOP — loop counter goes backward (i-- instead of i++)' },
  // math_utils.c: factorial always returns 0
  { find: 'int result = 1;', replace: 'int result = 0;', desc: 'WRONG INIT — result starts at 0 so factorial always returns 0' },
  // string_ops.c: negative string length → crash
  { find: 'int len = strlen(str);', replace: 'int len = -1;', desc: 'CRASH — string length set to -1 (negative index access)' },
  // string_ops.c: division by zero inside loop
  { find: 'if (*str == c) count++;', replace: 'if (*str == c) count += 1/0;', desc: 'RUNTIME ERROR — division by zero (1/0) on character match' },
  // array_sort.c: massive buffer overflow
  { find: 'j < n - i - 1; j++', replace: 'j < 99999; j++', desc: 'BUFFER OVERFLOW — loop runs to 99999 instead of array size' },
  // array_sort.c: sort comparison reversed
  { find: 'arr[j] > arr[j + 1]', replace: 'arr[j] < arr[j + 1]', desc: 'WRONG OUTPUT — sort comparison flipped (sorts descending)' },
  // linked_list.c: NULL pointer dereference
  { find: 'Node *node = (Node *)malloc(sizeof(Node));', replace: 'Node *node = NULL;', desc: 'NULL PTR CRASH — pointer set to NULL instead of malloc' },
  // linked_list.c: self-referencing node → infinite traversal
  { find: 'node->next = NULL;', replace: 'node->next = node;', desc: 'INFINITE LOOP — node points to itself (circular reference)' },
  // file_io.c: resource leak (fclose removed)
  { find: 'fclose(fp);', replace: '/* fclose(fp); */', desc: 'RESOURCE LEAK — file handle never closed (fclose commented out)' },
  // file_io.c: null check removed → crash on missing file
  { find: 'if (fp == NULL) return -1;', replace: '/* null check removed */', desc: 'CRASH — NULL check removed, will crash if file not found' },
  // calculator.c: divide-by-zero guard removed
  { find: 'if (b == 0) return 0;', replace: '/* zero check removed */', desc: 'DIVISION BY ZERO — safety guard removed, crashes when b=0' },
  // calculator.c: add returns wrong result
  { find: 'return a + b;', replace: 'return a - b;', desc: 'WRONG RESULT — add() actually subtracts (+ changed to -)' },
  // stack.c: overflow check broken
  { find: 's->top >= MAX_SIZE - 1', replace: 's->top >= 999999', desc: 'STACK OVERFLOW — size check uses 999999 instead of MAX_SIZE' },
  // stack.c: bounds check removed → negative array index
  { find: 'if (s->top < 0) return -1;', replace: '/* bounds check removed */', desc: 'CRASH — negative index access (bounds check removed)' },
  // matrix.c: loop goes 10x too far → buffer overflow
  { find: 'i < ROWS; i++', replace: 'i < ROWS * 10; i++', desc: 'BUFFER OVERFLOW — loop runs 10x past array bounds (ROWS*10)' },
  // search.c: infinite loop in binary search
  { find: 'low = mid + 1;', replace: 'low = mid;', desc: 'INFINITE LOOP — binary search never advances (mid+1 → mid)' },
  // search.c: search returns -1 even when found
  { find: 'if (arr[mid] == target) return mid;', replace: 'if (arr[mid] == target) return -1;', desc: 'ALWAYS FAILS — returns -1 even when target is found' },
  // temperature.c: NaN result
  { find: '9.0 / 5.0', replace: '0.0 / 0.0', desc: 'NaN ERROR — conversion formula uses 0.0/0.0 (produces NaN)' },
  // temperature.c: division by zero in average
  { find: 'return sum / n;', replace: 'return sum / 0;', desc: 'DIVISION BY ZERO — average always divides by 0' },
];


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
      const numClean = CONFIG.CODE_FILES.MIN_CLEAN
        + Math.floor(Math.random() * (CONFIG.CODE_FILES.MAX_CLEAN - CONFIG.CODE_FILES.MIN_CLEAN + 1));

      const files = [];

      for (let i = 0; i < numClean; i++) {
        const tpl = shuffledClean[cleanIdx % shuffledClean.length];
        cleanIdx++;
        files.push({
          name: tpl.name,
          code: tpl.code,
          original: tpl.code,
          isClean: true,
          suspiciousFunctions: [],
        });
      }

      // Hackers get ONE extra file that contains suspicious function names
      if (player.isHacker()) {
        const sig = shuffledSig[sigIdx % shuffledSig.length];
        sigIdx++;
        const insertAt = Math.floor(Math.random() * (files.length + 1));
        files.splice(insertAt, 0, {
          name: sig.name,
          code: sig.code,
          original: sig.code,
          isClean: false,
          suspiciousFunctions: sig.suspiciousFunctions,
        });
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
    if (entry.infected) return [];  // already corrupted

    const result = [];  // { fileIdx, fileName, patches: [{ patchIdx, desc }] }
    for (let fi = 0; fi < entry.files.length; fi++) {
      const file = entry.files[fi];
      if (!file.isClean) continue; // skip hacker signature files
      const applicable = [];
      for (let pi = 0; pi < CORRUPTION_PATCHES.length; pi++) {
        if (file.code.includes(CORRUPTION_PATCHES[pi].find)) {
          applicable.push({ patchIdx: pi, desc: CORRUPTION_PATCHES[pi].desc });
        }
      }
      if (applicable.length > 0) {
        result.push({ fileIdx: fi, fileName: file.name, patches: applicable });
      }
    }
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

    const patch = CORRUPTION_PATCHES[patchIdx];
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
    const patches = CodeEngine.shuffle([...CORRUPTION_PATCHES]);

    for (const patch of patches) {
      for (const file of CodeEngine.shuffle([...cleanFiles])) {
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
   */
  static getCorruptionDetails(codeStore, targetId) {
    const entry = codeStore.get(targetId);
    if (!entry) return { corrupted: false, reason: 'player_not_found' };

    if (!entry.infected) {
      return { corrupted: false, playerName: entry.playerName };
    }

    // Return corrupted file details + full files so admin can read the code
    const corruptedFile = entry.files[entry.corruptedFileIdx];
    return {
      corrupted: true,
      playerName: entry.playerName,
      fileIdx: entry.corruptedFileIdx,
      fileName: corruptedFile?.name,
      corruptionDesc: entry.corruptionPatch?.desc || 'Unknown corruption',
      // Full files so admin can view the infected code
      files: entry.files.map(f => ({ name: f.name, code: f.code })),
      // Repair option (mirrors hacker inject option structure)
      repairOptions: [{
        fileIdx: entry.corruptedFileIdx,
        fileName: corruptedFile?.name,
        fixes: [{
          desc: entry.corruptionPatch?.desc || 'Restore original code',
        }],
      }],
    };
  }

  /**
   * Admin fixes (reverts) corruption in a player's code.
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
   *  SECURITY LEAD ACTION: scan for hacker signatures
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
