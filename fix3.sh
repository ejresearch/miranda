# Update the fix script to test the correct projects endpoint
cat > update_fix_script.sh << 'EOF'
#!/bin/bash

echo "🔧 Updating fix script with correct projects endpoint..."

# Update the projects endpoint in the fix script
sed -i.bak 's|"/projects"|"/projects/projects"|g' fix2.sh
sed -i.bak 's|"/projects/list"|"/projects/projects"|g' fix2.sh
sed -i.bak 's|"/project_manager/projects"|"/projects/projects"|g' fix2.sh

echo "✅ Fix script updated!"
echo "Now run: bash fix2.sh"
EOF

chmod +x update_fix_script.sh
bash update_fix_script.sh
