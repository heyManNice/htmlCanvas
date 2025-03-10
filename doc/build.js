import fs from 'fs';

class Generator {
    /**
     * 目录
     */
    docDir = './doc';
    buildDir = this.docDir+'/build';
    srcDir = './src';

    /**
     * 过滤文件夹
     * 
     * @returns {string[]}
     * 文件名列表数组
     */
    getSrcFiles() {
        let files = fs.readdirSync(this.srcDir);
        //过滤目录
        let filtedFiles = files.filter((file) => {
            return fs.statSync(this.srcDir+"/"+file).isFile(); 
        })
        this.copyDirsFiles();
        return filtedFiles;
    }

    /**
     * 复制源码文件夹到构建文件夹下
     * 复制主页文件夹到构建文件夹下
     */
    copyDirsFiles() {
        fs.cpSync(this.srcDir, this.buildDir, {recursive: true});
        fs.copyFileSync(this.docDir+'/index.html', this.buildDir+'/index.html');
    }

    /**
     * 更换主页文件中特定变量的数据
     * @param {string[]} files
     * 文件名列表数组
     */
    writeData2Html(files) {
        const data = `const Project_Files_Data = ${JSON.stringify(files)};`;
        let index = fs.readFileSync(this.buildDir+'/index.html', 'utf-8');
        index = index.replace('const Project_Files_Data = [];', data);
        fs.writeFileSync(this.buildDir+'/index.html', index);
    }
    /**
     * 开始生成数据
     * 将当前目录下的目标文件名写入data.js文件
     */
    generate() {
        this.copyDirsFiles();
        const files = this.getSrcFiles();
        this.writeData2Html(files);
    }
}

const generator = new Generator();
generator.generate();
console.log('success');
