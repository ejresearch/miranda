#!/bin/bash

# Step-by-Step Manual Testing for Nell Beta
# Run each command individually to debug issues

echo "🔧 Nell Beta Manual Testing Guide"
echo "================================="
echo ""
echo "Files needed:"
echo "  📄 ~/Desktop/sample.csv"
echo "  📄 ~/Desktop/test1.txt"
echo ""
echo "🚀 Start your backend first:"
echo "  cd backend && python main.py"
echo ""
echo "Then run these commands one by one:"
echo ""

echo "1️⃣ BASIC HEALTH CHECK"
echo "curl -X GET http://localhost:8000/healthcheck"
echo ""

echo "2️⃣ CREATE PROJECT"
echo "curl -X POST http://localhost:8000/projects/new \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"name\": \"test_data\"}'"
echo ""

echo "3️⃣ LIST PROJECTS"
echo "curl -X GET http://localhost:8000/projects"
echo ""

echo "4️⃣ CREATE BUCKET FOR DOCUMENTS"
echo "curl -X POST http://localhost:8000/projects/test_data/buckets/new \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"bucket\": \"sample_docs\"}'"
echo ""

echo "5️⃣ UPLOAD TEXT DOCUMENT"
echo "curl -X POST http://localhost:8000/projects/test_data/buckets/sample_docs/ingest \\"
echo "  -F 'file=@$HOME/Desktop/test1.txt'"
echo ""

echo "6️⃣ QUERY THE DOCUMENT WITH AI"
echo "curl -X POST http://localhost:8000/projects/test_data/buckets/sample_docs/query \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"query\": \"What is this document about?\"}'"
echo ""

echo "7️⃣ UPLOAD CSV DATA"
echo "curl -X POST http://localhost:8000/projects/test_data/tables/upload_csv \\"
echo "  -F 'file=@$HOME/Desktop/sample.csv' \\"
echo "  -F 'project=test_data' \\"
echo "  -F 'table_name=sample_data'"
echo ""

echo "8️⃣ VIEW TABLE DATA"
echo "curl -X GET 'http://localhost:8000/projects/test_data/tables/sample_data?project=test_data'"
echo ""

echo "9️⃣ RUN BRAINSTORM WITH BOTH DATA SOURCES"
echo "curl -X POST http://localhost:8000/projects/test_data/brainstorm/brainstorm \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"project_id\": \"test_data\","
echo "    \"scene_id\": \"analysis\","
echo "    \"scene_description\": \"Analyze the uploaded data\","
echo "    \"selected_buckets\": [\"sample_docs\"],"
echo "    \"custom_prompt\": \"Generate insights\","
echo "    \"tone\": \"analytical\""
echo "  }'"
echo ""

echo "🔟 LIST ALL TABLES"
echo "curl -X GET 'http://localhost:8000/projects/test_data/tables/list?project=test_data'"
echo ""

echo "📊 DEBUGGING TIPS:"
echo "=================="
echo "• If 404 errors: Check your backend routing"
echo "• If 500 errors: Check backend logs for Python errors"
echo "• If OpenAI errors: Set OPENAI_API_KEY environment variable"
echo "• If file errors: Make sure ~/Desktop/sample.csv and ~/Desktop/test1.txt exist"
echo "• If database errors: Check if projects/ directory exists and is writable"
echo ""

echo "🔍 QUICK FILE CHECK:"
echo "===================="
if [ -f "$HOME/Desktop/sample.csv" ]; then
    echo "✅ sample.csv found"
    echo "   First few lines:"
    head -3 "$HOME/Desktop/sample.csv" | sed 's/^/   /'
else
    echo "❌ sample.csv NOT found at ~/Desktop/sample.csv"
fi

if [ -f "$HOME/Desktop/test1.txt" ]; then
    echo "✅ test1.txt found"
    echo "   File size: $(wc -c < "$HOME/Desktop/test1.txt") bytes"
    echo "   First line: $(head -1 "$HOME/Desktop/test1.txt")"
else
    echo "❌ test1.txt NOT found at ~/Desktop/test1.txt"
fi
