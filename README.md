# ការរៀបចំ Deploy ប្រព័ន្ធតាមដានទិន្នន័យបណ្តាញសាលារៀន ជាមួយ GitHub Pages (Live Data Sync)

ឯកសារនេះណែនាំពីរបៀបយកផ្ទាំង Web Dashboard ទៅដាក់លើ **GitHub Pages** ដោយនៅតែអាច **ទាញទិន្នន័យផ្ទាល់ (Live Sync)** និង **Upload / សម្អាតទិន្នន័យ** ទៅកាន់ **Google Sheets** បានយ៉ាងរលូន ១០០%។

---

## ជំហានទី ១៖ ធ្វើបច្ចុប្បន្នភាពកូដ Google Apps Script (Backend)

ដើម្បីឱ្យ GitHub Pages អាចទាក់ទងមក Google Sheets បាន Apps Script ត្រូវដើរតួជា **REST API** (គាំទ្រ `doGet` និង `doPost`):

1. បើក Google Sheets របស់អ្នក រួចចូលទៅកាន់មឺនុយ **Extensions** -> **Apps Script**
2. ចម្លងកូដនៅក្នុងឯកសារ `Code.gs` ទៅជំនួសកូដចាស់ទាំងអស់ក្នុង Apps Script
3. ចុច **Save** (រូបថាស Icon)
4. ចុចប៊ូតុងពណ៌ខៀវ **Deploy** (ខាងលើស្តាំ) -> ជ្រើសរើស **Manage deployments**
5. ចុចរូប **ខ្មៅដៃ (Edit)** នៅលើ deployment បច្ចុប្បន្ន
6. នៅត្រង់ **Version** ជ្រើសរើសយក **New version** (សំខាន់ណាស់ ដើម្បីឱ្យកូដថ្មីដំណើរការ)
7. ពិនិត្យមើលការកំណត់៖
   - **Execute as:** `Me (អុីមែលរបស់អ្នក)`
   - **Who has access:** `Anyone` (អ្នកណាក៏ដោយ - សំខាន់ខ្លាំងជៀសវាងជាប់បញ្ហា CORS)
8. ចុច **Deploy** ហើយពិនិត្យមើល URL របស់ Web App (ជាទូទៅ URL ដដែលគឺ `https://script.google.com/macros/s/.../exec`)

---

## ជំហានទី ២៖ ត្រួតពិនិត្យ URL ក្នុងឯកសារ `index.html`

បើកឯកសារ `index.html` រួចពិនិត្យមើលត្រង់បន្ទាត់ប្រហែលលេខ 280៖
```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwA-FkKmbtcYFXtu5dPm7W_78uIjvIUWFFXzQ9j7i8-9Js9B7vThadSRZqplcMvqgA-/exec';
```
*(ប្រសិនបើ Web App URL របស់អ្នកមានការប្រែប្រួល សូមប្តូរ URL នោះមកដាក់ត្រង់នេះ)*

---

## ជំហានទី ៣៖ បង្កើត GitHub Repository និង Deploy លើ GitHub Pages

### របៀបទី ១៖ តាមរយៈផ្ទាំង Web Browser របស់ GitHub (សាមញ្ញបំផុត)
1. ចូលទៅកាន់ [GitHub.com](https://github.com) រួច Sign in
2. ចុចប៊ូតុង **New** ដើម្បីបង្កើត Repository ថ្មី (ឧទាហរណ៍ដាក់ឈ្មោះថា `school-dashboard`)
3. កំណត់ជា **Public** រួចចុច **Create repository**
4. ចុចលើពាក្យ **uploading an existing file**
5. អូសទម្លាក់ (Drag & Drop) ឯកសារ `index.html` ចូល រួចចុច **Commit changes**
6. ចូលទៅកាន់ **Settings** (នៃ repository នោះ)
7. នៅខាងឆ្វេងដៃ ចុចលើពាក្យ **Pages**
8. ត្រង់ចំណុច **Branch** (ក្រោម Build and deployment):
   - ប្តូរពី `None` ទៅជា `main` (ឬ `master`)
   - ថត Folder ទុកនៅ `/ (root)`
   - ចុច **Save**
9. រង់ចាំប្រហែល ១ ទៅ ២ នាទី GitHub នឹងផ្តល់ Link គេហទំព័រផ្ទាល់៖
   `https://<your-username>.github.io/school-dashboard/`

### របៀបទី ២៖ តាមរយៈ Git Command Line
```bash
cd C:\Users\Asus\.gemini\antigravity\scratch\school-network-dashboard
git init
git add index.html README.md
git commit -m "Deploy School Dashboard with Live Google Sheets Sync"
git branch -M main
git remote add origin https://github.com/<your-username>/school-dashboard.git
git push -u origin main
```
បន្ទាប់មកចូលទៅ GitHub Settings -> Pages ដើម្បីបើកដំណើរការដូចជំហានខាងលើ។

---

## លក្ខណៈពិសេសក្រោយពេល Deploy លើ GitHub Pages
- **Live Sync:** ទាញទិន្នន័យដោយស្វ័យប្រវត្តពីរៀងរាល់ ១៥ វិនាទីម្តង
- **Upload Excel:** អាច Upload ឯកសារ Excel ផ្ទាល់ពី GitHub Pages ចូលទៅ Google Sheets ដោយស្វ័យប្រវត្តិ
- **សម្អាតទិន្នន័យ (Clear Data):** ការពារដោយលេខកូដសម្ងាត់ `168`
- **របាយការណ៍ស្ថិតិអប់រំ:** តារាងកុមារមត្តេយ្យ (២.ក១) និងបឋមសិក្សា (២.ក២) គិតត្រឹម 01/11/2026 ត្រឹមត្រូវតាមស្ដង់ដារក្រសួង
- **Export Excel:** ទាញយករបាយការណ៍ជា Excel គ្រប់ទម្រង់
