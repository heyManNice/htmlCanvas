import fs from 'fs';

class Generator {
    /**
     * 屏蔽的文件
     */
    filterFiles = [
        'node_modules',
        'dist',
        'build',
        'lib',
        'public',
        'src',
        'test',
        'docs',
        '.git',
        '.idea',
        '.vscode',
        '.DS_Store',
        '.gitignore',
        '.gitattributes',
        '.gitmodules',
        'data.js',
        'generateData.js',
        'package.json',
        'package-lock.json',
        '.github',
        'index.html',
        'README.md',
    ];

    /**
     * 获取过滤后的目标文件数据
     * 
     * @returns {string[]}
     * 文件名列表数组
     */
    getFiles() {
        let files = fs.readdirSync('./');
        let filtedFiles = files.filter((file) => {
            return !this.filterFiles.includes(file); 
        })
        return filtedFiles;
    }

    /**
     * 写入data文件
     * 
     * @param {string[]} files
     * 文件名列表数组
     */
    writeData(files) {
        let data = `var data = ${JSON.stringify(files)};`;
        fs.writeFileSync('./data.js', data); 
    }

    /**
     * 开始生成数据
     * 将当前目录下的目标文件名写入data.js文件
     */
    generate() {
        let files = this.getFiles();
        this.writeData(files);
    }
}

let generator = new Generator();
generator.generate();
