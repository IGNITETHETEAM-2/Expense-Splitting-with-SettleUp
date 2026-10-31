# Expense Splitter ⚡

A modern, production-ready Full-Stack Java Spring Boot application with SQL database persistence for smart group expense splitting and greedy debt minimization (SettleUp algorithm).

Built with **Java 17**, **Spring Boot 3.2.5**, **Spring Data JPA**, **H2 SQL Database**, and an ultra-modern, responsive Single-Page Dashboard featuring glassmorphic UI, dark/light themes, and real-time precision calculations.

---

## 🌟 Key Highlights & Requirements

### 1. 👥 Unlimited Team Size & Members
- **Zero team size restrictions**: Create groups with 2, 5, 10, 50, or any number of members.
- Dynamic member chip toggles for effortless member assignment.
- Add and manage registered people anytime with instant directory updates.

### 2. 🧮 Precise Splitting Algorithms
- **Equal Split (`Total / N`)**: Mathematically allocates equal shares with exact cent/paise remainder distribution so the sum of individual shares exactly matches the total expense down to `0.01`.
- **Exact Amounts Split**: Assign custom exact amounts per person with a live balance validation counter preventing submission until the exact total is reached.
- **Percentage Split (`100%`)**: Split expenses by custom percentages with live validation ensuring total equals 100% and automated penny rounding adjustment on the largest share.
- **Shares / Ratio Split**: Split by fractional ratios (e.g., 2 shares, 1 share) for unequal consumption models.

### 3. ⚖️ SettleUp Debt Simplification Algorithm
Implements a greedy transaction minimization algorithm:
1. Computes net balances: `Net = (Total Paid in Expenses + Settlements) - (Total Share Owed)`.
2. Segregates participants into Debtors (`Net < 0`) and Creditors (`Net > 0`).
3. Sorts both lists in descending order of absolute balances.
4. Matches the largest debtor with the largest creditor to resolve the maximum possible debt in a single transaction.
5. Generates the minimal possible number of peer-to-peer settlement transactions.
6. **1-Click "Settle Now" Action**: Instantly records settlement payments in the SQL database and updates balances in real time.

### 4. 📊 Dashboard Analytics & Export
- Live KPI cards: Total Group Expenses, Active Groups, Registered People, Total Settled.
- Visual category spending breakdown with progress indicators.
- Complete transaction log with date, payer, group, and category.
- **CSV Export**: Download complete expense audit trails in one click.
- **Printable Reports**: Formatted print layout for expense receipts and summaries.

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend Framework** | Java 17, Spring Boot 3.2.5 |
| **Persistence / SQL Database** | Spring Data JPA, Hibernate, H2 Database (File Persistent) |
| **REST APIs** | Spring Web MVC, Jackson JSON, Bean Validation |
| **Frontend** | Modern Vanilla HTML5, CSS3 Custom Properties, Vanilla JavaScript |
| **Styling & Aesthetics** | Glassmorphism, Google Fonts (Plus Jakarta Sans & JetBrains Mono), Dark/Light Modes |
| **Build & Tooling** | Apache Maven 3.9.6 |

---

## 🚀 Running the Project Locally

### Prerequisites
- Java 17+
- Maven 3.8+

### Step 1: Run with Maven
```powershell
mvn spring-boot:run
```

Or run the packaged JAR:
```powershell
java -jar target/expense-splitter-1.0.0.jar
```

### Step 2: Open in Browser
Open your browser and navigate to:
```
http://localhost:8080
```

### Step 3: Access H2 SQL Web Console
To inspect the relational SQL tables directly in your browser:
- **URL**: `http://localhost:8080/h2-console`
- **JDBC URL**: `jdbc:h2:file:./data/expensedb`
- **User Name**: `sa`
- **Password**: *(leave blank)*

---

## 📡 REST API Endpoints

### Users
- `GET /api/users` - List all registered members
- `POST /api/users` - Register a new member
- `DELETE /api/users/{id}` - Delete a member

### Groups
- `GET /api/groups` - List all groups with members
- `GET /api/groups/{id}` - Get group details
- `GET /api/groups/{id}/analysis` - Get net balances and SettleUp transaction recommendations
- `POST /api/groups` - Create a group with any number of members

### Expenses
- `GET /api/expenses` - List all expenses (filter by `?groupId=`)
- `POST /api/expenses` - Create an expense with precise split shares
- `DELETE /api/expenses/{id}` - Delete an expense

### Settlements
- `GET /api/settlements` - List recorded settlement payments
- `POST /api/settlements` - Record a debt settlement transaction

### Analytics
- `GET /api/analytics/dashboard` - Get high-level KPI metrics & category spending

---

## 📄 License
MIT License. Created for Full-Stack Development (FSD Training).
