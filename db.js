// ===== JSON 文件数据库 =====
// 使用 JSON 文件持久化存储，无需原生编译的 SQLite

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'database');
const DB_FILE = path.join(DB_DIR, 'db.json');

// 确保数据库目录存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// ===== 初始数据 =====
const initialSoftware = [
  { id: 'python', name: 'Python / Jupyter', icon: '🐍', color: '#3776ab', bgColor: '#e8f1fa', version: 'Python 3.10+ / Jupyter Notebook 7+', description: '数据分析、可视化、科学计算的首选工具' },
  { id: 'mysql', name: 'MySQL', icon: '🗄️', color: '#00758f', bgColor: '#e6f4f7', version: 'MySQL 8.0 / Workbench 8.0', description: '关系型数据库管理，SQL 查询与数据操作' },
  { id: 'matlab', name: 'MATLAB', icon: '📊', color: '#e1673a', bgColor: '#fdf0eb', version: 'MATLAB R2023a / R2023b', description: '数学计算、算法开发、数据可视化与建模' },
  { id: 'eclipse', name: 'Java / Eclipse', icon: '☕', color: '#e76f00', bgColor: '#fef5ec', version: 'Eclipse IDE 2023+ / JDK 17+', description: 'Java 开发环境配置、项目创建与调试' },
  { id: 'illustrator', name: 'Photoshop / Illustrator', icon: '🎨', color: '#6e64ce', bgColor: '#f0eef9', version: 'Adobe 2024 (CC)', description: '图形设计、图像处理、矢量绘图' },
  { id: 'autocad', name: 'AutoCAD', icon: '📐', color: '#c8102e', bgColor: '#fdecef', version: 'AutoCAD 2024', description: '工程制图、二维绘图与三维建模' }
];

const initialTutorials = [
  { id: 1, softwareId: 'python', title: 'Jupyter Notebook 安装与启动', difficulty: '入门', steps: [
    { text: '打开命令提示符（Win+R 输入 cmd），输入安装命令' },
    { text: '等待安装完成，看到 Successfully installed 提示即成功' },
    { text: '在目标文件夹地址栏输入 jupyter notebook 回车启动' },
    { text: '浏览器自动打开 Notebook 界面，点击 New → Python 3 创建笔记本' }
  ]},
  { id: 2, softwareId: 'python', title: '数据可视化中文乱码解决', difficulty: '进阶', steps: [
    { text: '在代码开头导入 matplotlib，设置中文字体参数' },
    { text: "添加 plt.rcParams['font.sans-serif'] = ['SimHei'] 解决中文显示" },
    { text: "添加 plt.rcParams['axes.unicode_minus'] = False 解决负号显示" },
    { text: '重新运行绘图代码，中文标题和坐标轴正常显示' }
  ]},
  { id: 3, softwareId: 'python', title: '第三方库安装与虚拟环境', difficulty: '入门', steps: [
    { text: '使用 pip install 包名 安装第三方库，如 pip install numpy' },
    { text: '创建虚拟环境：python -m venv myenv' },
    { text: '激活虚拟环境：myenv\\Scripts\\activate' },
    { text: '在虚拟环境中安装所需库，避免版本冲突' }
  ]},
  { id: 4, softwareId: 'mysql', title: 'MySQL 服务启动与连接', difficulty: '入门', steps: [
    { text: '打开服务管理器（Win+R 输入 services.msc），找到 MySQL80 服务' },
    { text: '右键启动服务，或命令行输入 net start mysql80' },
    { text: '打开 MySQL Workbench，点击已配置的连接进入管理界面' },
    { text: '在 Query 窗口输入 SQL 语句，点击闪电图标执行' }
  ]},
  { id: 5, softwareId: 'mysql', title: '创建数据库与数据表', difficulty: '入门', steps: [
    { text: 'CREATE DATABASE 数据库名; 创建新数据库' },
    { text: 'USE 数据库名; 切换到目标数据库' },
    { text: 'CREATE TABLE 表名 (字段名 类型 约束, ...); 创建数据表' },
    { text: 'INSERT INTO 表名 VALUES (...); 插入测试数据' }
  ]},
  { id: 6, softwareId: 'mysql', title: '数据查询与多表连接', difficulty: '进阶', steps: [
    { text: 'SELECT * FROM 表名 WHERE 条件; 基础条件查询' },
    { text: '使用 JOIN 连接多表：SELECT ... FROM A JOIN B ON A.id = B.aid' },
    { text: '使用 GROUP BY 分组统计，配合 COUNT/SUM/AVG 聚合函数' },
    { text: '使用 ORDER BY 排序，LIMIT 限制返回行数' }
  ]},
  { id: 7, softwareId: 'matlab', title: 'MATLAB 基本操作与矩阵运算', difficulty: '入门', steps: [
    { text: '启动 MATLAB，在命令窗口直接输入数学表达式进行计算' },
    { text: '创建矩阵：A = [1 2 3; 4 5 6; 7 8 9]，分号分隔行' },
    { text: "矩阵运算：A*B（矩阵乘法）、A.*B（元素乘法）、A'（转置）" },
    { text: '使用 disp() 或直接输入变量名查看结果，分号结尾则不显示输出' }
  ]},
  { id: 8, softwareId: 'matlab', title: '二维三维绘图', difficulty: '进阶', steps: [
    { text: 'plot(x, y) 绘制二维线图，x 和 y 为同长度向量' },
    { text: "添加标题和标签：title('标题')、xlabel('X轴')、ylabel('Y轴')" },
    { text: 'plot3(x, y, z) 绘制三维曲线，surf(X,Y,Z) 绘制三维曲面' },
    { text: '使用 subplot 在一个窗口中绘制多个子图' }
  ]},
  { id: 9, softwareId: 'matlab', title: '脚本编写与函数定义', difficulty: '进阶', steps: [
    { text: '点击 New Script 创建 .m 脚本文件' },
    { text: '在脚本中编写多行代码，以分号结尾减少输出' },
    { text: '定义函数：function [输出] = 函数名(输入)，保存为同名 .m 文件' },
    { text: '在命令窗口调用函数，或在其他脚本中引用' }
  ]},
  { id: 10, softwareId: 'eclipse', title: 'Eclipse 项目导入与配置', difficulty: '入门', steps: [
    { text: 'File → Import → General → Existing Projects into Workspace' },
    { text: '选择项目根目录，勾选项目，点击 Finish 完成导入' },
    { text: '右键项目 → Properties → Java Build Path 检查依赖配置' },
    { text: '确认 JRE 系统库正确，缺少的库通过 Add JARs 添加' }
  ]},
  { id: 11, softwareId: 'eclipse', title: 'Java 程序编写与运行', difficulty: '入门', steps: [
    { text: '右键 src → New → Class 创建 Java 类，勾选 public static void main' },
    { text: '在 main 方法中编写代码，使用 System.out.println 输出' },
    { text: '右键代码区域 → Run As → Java Application 运行程序' },
    { text: '在 Console 窗口查看输出结果' }
  ]},
  { id: 12, softwareId: 'eclipse', title: '断点调试与错误排查', difficulty: '进阶', steps: [
    { text: '在代码行号左侧双击，添加蓝色断点标记' },
    { text: '右键 → Debug As → Java Application 进入调试模式' },
    { text: '使用 F5（Step Into）、F6（Step Over）逐步执行' },
    { text: '在 Variables 视图查看变量值，定位逻辑错误' }
  ]},
  { id: 13, softwareId: 'illustrator', title: 'Illustrator 描边与填充操作', difficulty: '入门', steps: [
    { text: '选择工具选中目标图形，查看左侧工具栏颜色面板' },
    { text: '双击填色方块选择颜色，描色方块设置描边颜色' },
    { text: '在属性面板调整描边粗细，勾选对齐描边选项' },
    { text: '执行对象 → 扩展外观后，重新选中图形即可填充新颜色' }
  ]},
  { id: 14, softwareId: 'illustrator', title: 'Photoshop 图层与蒙版', difficulty: '进阶', steps: [
    { text: '在图层面板右下角点击新建图层按钮，或 Ctrl+Shift+N' },
    { text: '选中图层点击添加图层蒙版按钮（带圆圈的矩形图标）' },
    { text: '选择画笔工具，前景色设为黑色涂抹隐藏区域，白色显示' },
    { text: '调整图层不透明度和混合模式，实现自然过渡效果' }
  ]},
  { id: 15, softwareId: 'illustrator', title: '导出与格式设置', difficulty: '入门', steps: [
    { text: '文件 → 导出 → 导出为，选择目标格式（PNG/JPG/PDF）' },
    { text: 'PNG 勾选透明背景，JPG 调整品质滑块（建议 80%+）' },
    { text: '勾选画板选项，可导出多个画板为独立文件' },
    { text: '点击导出，选择保存路径完成输出' }
  ]},
  { id: 16, softwareId: 'autocad', title: 'AutoCAD 基本绘图操作', difficulty: '入门', steps: [
    { text: '命令行输入 L（Line）回车，点击起点和终点绘制直线' },
    { text: '输入 C（Circle）回车，指定圆心和半径绘制圆' },
    { text: '输入 REC（Rectangle）绘制矩形，输入 POL 绘制正多边形' },
    { text: '使用 OSNAP（对象捕捉）精确捕捉端点、中点、交点' }
  ]},
  { id: 17, softwareId: 'autocad', title: '图层管理与标注', difficulty: '进阶', steps: [
    { text: '输入 LA（Layer）打开图层管理器，新建粗实线、细实线等图层' },
    { text: '设置各图层颜色、线型、线宽，不同图层绘制不同内容' },
    { text: '输入 D（DimStyle）设置标注样式，调整箭头大小和文字高度' },
    { text: '使用 DLI（线性标注）、DAL（对齐标注）进行尺寸标注' }
  ]},
  { id: 18, softwareId: 'autocad', title: '图纸打印与输出', difficulty: '进阶', steps: [
    { text: 'Ctrl+P 打开打印对话框，选择打印机或 PDF 输出' },
    { text: '选择图纸幅面（A4/A3），设置打印范围（窗口/范围/显示）' },
    { text: '勾选居中打印和布满图纸，调整打印比例' },
    { text: '预览确认无误后点击打印，输出最终图纸' }
  ]},

  // ===== 新增教程 =====

  // Python/Jupyter 新增
  { id: 19, softwareId: 'python', title: 'Pandas DataFrame 数据处理', difficulty: '进阶', steps: [
    { text: '导入 pandas：import pandas as pd' },
    { text: '读取数据：df = pd.read_csv("文件.csv") 或 pd.read_excel("文件.xlsx")' },
    { text: '数据筛选：df[df["列名"] > 值] 按条件筛选行，df[["列1","列2"]] 选择列' },
    { text: '数据清洗：df.dropna() 删除空值行，df.fillna(0) 用 0 填充空值' },
    { text: '统计分析：df.describe() 查看各列统计摘要，df.groupby("列名").mean() 分组统计' }
  ]},
  { id: 20, softwareId: 'python', title: '文件读写与数据保存', difficulty: '入门', steps: [
    { text: '读取文本文件：with open("file.txt", "r") as f: content = f.read()' },
    { text: '写入文本文件：with open("out.txt", "w") as f: f.write("内容")' },
    { text: '保存 DataFrame：df.to_csv("result.csv", index=False) 或 df.to_excel("result.xlsx")' },
    { text: 'JSON 文件读写：import json → json.dump(data, f) / json.load(f)' }
  ]},
  { id: 21, softwareId: 'python', title: '异常处理与代码调试', difficulty: '进阶', steps: [
    { text: '使用 try-except 捕获异常：try: ... except ValueError as e: print(e)' },
    { text: '常见异常类型：TypeError（类型错误）、IndexError（索引越界）、FileNotFoundError（文件不存在）' },
    { text: '在 Jupyter 中使用 %debug 魔法命令进入交互式调试器' },
    { text: '使用 pdb 模块：import pdb; pdb.set_trace() 在代码中设置断点' }
  ]},
  { id: 22, softwareId: 'python', title: 'NumPy 数组操作基础', difficulty: '入门', steps: [
    { text: '导入 NumPy：import numpy as np' },
    { text: '创建数组：np.array([1,2,3])、np.zeros(5)、np.arange(0,10,2)' },
    { text: '数组运算：arr * 2（逐元素乘）、arr.sum()（求和）、arr.reshape(2,3)（变形）' },
    { text: '索引切片：arr[0]（第一个）、arr[1:4]（切片）、arr[arr > 5]（条件索引）' }
  ]},

  // MySQL 新增
  { id: 23, softwareId: 'mysql', title: '数据导入与导出', difficulty: '入门', steps: [
    { text: '导出整库：mysqldump -u root -p 数据库名 > backup.sql' },
    { text: '导入数据：mysql -u root -p 数据库名 < backup.sql' },
    { text: '导出 CSV：SELECT ... INTO OUTFILE "路径.csv" FIELDS TERMINATED BY ","' },
    { text: '导入 CSV：LOAD DATA INFILE "路径.csv" INTO TABLE 表名 FIELDS TERMINATED BY ","' }
  ]},
  { id: 24, softwareId: 'mysql', title: '用户与权限管理', difficulty: '进阶', steps: [
    { text: '创建用户：CREATE USER "用户名"@"localhost" IDENTIFIED BY "密码"' },
    { text: '授予权限：GRANT SELECT, INSERT ON 数据库.* TO "用户名"@"localhost"' },
    { text: '查看权限：SHOW GRANTS FOR "用户名"@"localhost"' },
    { text: '撤销权限：REVOKE INSERT ON 数据库.* FROM "用户名"@"localhost"' }
  ]},
  { id: 25, softwareId: 'mysql', title: '存储过程与触发器', difficulty: '进阶', steps: [
    { text: '创建存储过程：CREATE PROCEDURE 名(参数) BEGIN ... END' },
    { text: '调用存储过程：CALL 名(参数)' },
    { text: '创建触发器：CREATE TRIGGER 名 BEFORE INSERT ON 表 FOR EACH ROW BEGIN ... END' },
    { text: '查看所有存储过程：SHOW PROCEDURE STATUS; 查看触发器：SHOW TRIGGERS' }
  ]},
  { id: 26, softwareId: 'mysql', title: '索引优化与查询性能', difficulty: '进阶', steps: [
    { text: '创建索引：CREATE INDEX idx_name ON 表名(列名)' },
    { text: '查看执行计划：EXPLAIN SELECT ... 分析查询效率' },
    { text: '避免全表扫描：WHERE 条件中使用索引列，避免 SELECT *' },
    { text: '复合索引遵循最左前缀原则，索引列顺序影响查询效率' }
  ]},

  // MATLAB 新增
  { id: 27, softwareId: 'matlab', title: '符号计算与方程求解', difficulty: '进阶', steps: [
    { text: '声明符号变量：syms x y' },
    { text: '求解方程：solve(x^2 - 4 == 0, x) 返回符号解' },
    { text: '求导与积分：diff(f, x) 求导，int(f, x) 积分' },
    { text: '符号化简：simplify(expr) 或 expand(expr) 展开表达式' }
  ]},
  { id: 28, softwareId: 'matlab', title: 'Simulink 仿真入门', difficulty: '入门', steps: [
    { text: '在 MATLAB 主页点击 Simulink → Blank Model 创建新模型' },
    { text: '从 Library Browser 拖拽模块到画布：Sources（输入源）、Sinks（输出）' },
    { text: '用连线连接各模块端口，双击模块设置参数' },
    { text: '点击 Run 运行仿真，在 Scope 模块查看输出波形' }
  ]},
  { id: 29, softwareId: 'matlab', title: '数据拟合与回归分析', difficulty: '进阶', steps: [
    { text: '准备数据：x 为自变量向量，y 为因变量向量' },
    { text: '多项式拟合：p = polyfit(x, y, n)，n 为拟合阶数' },
    { text: '绘制拟合曲线：y_fit = polyval(p, x); plot(x, y, x, y_fit)' },
    { text: '线性回归：[b, bint, r] = regress(y, X)，b 为回归系数' }
  ]},
  { id: 30, softwareId: 'matlab', title: '文件读写与数据导入', difficulty: '入门', steps: [
    { text: '读取 CSV：data = readmatrix("file.csv") 或 csvread("file.csv")' },
    { text: '读取 Excel：data = readtable("file.xlsx") 或 xlsread("file.xlsx")' },
    { text: '保存数据：writematrix(data, "out.csv") 或 writetable(tbl, "out.xlsx")' },
    { text: '保存变量到 .mat 文件：save("data.mat", "变量名")，加载：load("data.mat")' }
  ]},

  // Java/Eclipse 新增
  { id: 31, softwareId: 'eclipse', title: 'Maven 项目创建与配置', difficulty: '入门', steps: [
    { text: 'File → New → Other → Maven Project，勾选 Create a simple project' },
    { text: '填写 Group Id（如 com.example）和 Artifact Id（项目名）' },
    { text: '在 pom.xml 中添加依赖：搜索 Maven Repository 复制依赖 XML' },
    { text: '右键项目 → Maven → Update Project 刷新依赖' }
  ]},
  { id: 32, softwareId: 'eclipse', title: '接口与继承的实现', difficulty: '进阶', steps: [
    { text: '定义接口：public interface Animal { void speak(); }' },
    { text: '实现接口：public class Dog implements Animal { public void speak() { ... } }' },
    { text: '继承父类：public class Student extends Person { ... }，使用 super 调用父类方法' },
    { text: '重写方法加 @Override 注解，确保方法签名与父类/接口一致' }
  ]},
  { id: 33, softwareId: 'eclipse', title: 'JUnit 单元测试', difficulty: '进阶', steps: [
    { text: '在 pom.xml 中添加 JUnit 5 依赖（junit-jupiter-api、junit-jupiter-engine）' },
    { text: '创建测试类：右键 src/test/java → New → JUnit Test Case' },
    { text: '编写测试方法：@Test 标注，使用 assertEquals、assertTrue 等断言' },
    { text: '运行测试：右键测试类 → Run As → JUnit Test，查看绿色/红色结果' }
  ]},
  { id: 34, softwareId: 'eclipse', title: '异常处理与日志输出', difficulty: '入门', steps: [
    { text: 'try-catch 捕获异常：try { ... } catch (IOException e) { e.printStackTrace(); }' },
    { text: '多重 catch：按异常子类到父类顺序排列 catch 块' },
    { text: 'finally 块：无论是否异常都执行，用于关闭资源' },
    { text: '自定义异常：class MyException extends Exception { ... }' }
  ]},

  // PS/AI 新增
  { id: 35, softwareId: 'illustrator', title: 'Photoshop 选区与抠图技巧', difficulty: '进阶', steps: [
    { text: '快速选择工具（W）：自动识别边缘，涂抹即可选中区域' },
    { text: '魔棒工具：点击相似颜色区域一次选中，容差值控制颜色范围' },
    { text: '钢笔工具精确抠图：沿边缘点击创建路径，Ctrl+Enter 转为选区' },
    { text: '选区调整：Shift+选区工具添加，Alt+选区工具减去，Ctrl+D 取消选区' }
  ]},
  { id: 36, softwareId: 'illustrator', title: 'Illustrator 钢笔与路径工具', difficulty: '入门', steps: [
    { text: '钢笔工具（P）：点击创建直角点，拖拽创建平滑曲线点' },
    { text: '调整路径：使用直接选择工具（A）拖动锚点或方向线' },
    { text: '闭合路径：回到起始点点击闭合，或 Ctrl+点击结束开放路径' },
    { text: '路径编辑：添加锚点工具增加控制点，删除锚点工具减少控制点' }
  ]},
  { id: 37, softwareId: 'illustrator', title: '色彩模式与颜色管理', difficulty: '入门', steps: [
    { text: 'RGB 模式用于屏幕显示（网页、APP），CMYK 模式用于印刷' },
    { text: '切换色彩模式：文件 → 文档颜色模式 → RGB/CMYK' },
    { text: '拾色器使用：双击填色方块打开，输入色值或拖拽选择颜色' },
    { text: 'PS 中色相/饱和度调整：图像 → 调整 → 色相/饱和度（Ctrl+U）' }
  ]},
  { id: 38, softwareId: 'illustrator', title: 'Photoshop 滤镜与调色', difficulty: '进阶', steps: [
    { text: '常用调色：图像 → 调整 → 曲线（Ctrl+M）/色阶（Ctrl+L）调整明暗' },
    { text: '模糊滤镜：滤镜 → 模糊 → 高斯模糊，用于柔化背景或降噪' },
    { text: '锐化滤镜：滤镜 → 锐化 → USM 锯化，增强细节清晰度' },
    { text: '液化工具：滤镜 → 液化，用于人像修形和局部变形调整' }
  ]},

  // AutoCAD 新增
  { id: 39, softwareId: 'autocad', title: '尺寸标注样式设置', difficulty: '入门', steps: [
    { text: '输入 D（DimStyle）打开标注样式管理器，点击「新建」创建样式' },
    { text: '设置箭头大小（2.5~3）、文字高度（3~5）、文字位置（上方居中）' },
    { text: '设置标注精度：主单位 → 精度选 0.00 或 0' },
    { text: 'DLI（线性标注）、DAL（对齐标注）、DDI（直径标注）使用新样式' }
  ]},
  { id: 40, softwareId: 'autocad', title: '块定义与属性插入', difficulty: '进阶', steps: [
    { text: '选中图形后输入 B（Block），填写块名称和基点' },
    { text: '插入块：输入 I（Insert），选择块名，指定插入点和缩放比例' },
    { text: '定义属性：ATTDEF 添加文字属性（如编号、名称），随块一起插入' },
    { text: '编辑块属性：双击带属性的块，弹出编辑对话框修改属性值' }
  ]},
  { id: 41, softwareId: 'autocad', title: '布局空间与视口管理', difficulty: '进阶', steps: [
    { text: '点击底部「布局1」切换到布局空间（图纸空间）' },
    { text: '右键布局 → 页面设置管理器 → 选择打印设备和图纸尺寸' },
    { text: 'MVIEW 创建视口，在视口内双击进入模型空间调整显示比例' },
    { text: '设置视口比例：标准比例 1:1、1:2、1:5 等，锁定视口防止误缩放' }
  ]},
  { id: 42, softwareId: 'autocad', title: '修剪与延伸操作', difficulty: '入门', steps: [
    { text: '修剪：输入 TR（Trim），选择边界线，再点击要剪掉的部分' },
    { text: '延伸：输入 EX（Extend），选择边界线，再点击要延长的线段' },
    { text: '快速修剪：TR → 空格两次 → 直接点击要剪掉的线段' },
    { text: '倒角：CHA（Chamfer）设置倒角距离，圆角：F（Fillet）设置半径' }
  ]}
];

const initialErrors = [
  { id: 1, softwareId: 'python', keyword: 'pip不是内部命令', title: 'pip 不是内部或外部命令', version: 'Python 3.8+', severity: 'high', solution: ['打开系统环境变量设置：右键此电脑 → 属性 → 高级系统设置 → 环境变量', '在系统变量中找到 Path，点击编辑，新增 Python 安装路径和 Scripts 路径', '默认路径如：C:\\Users\\用户名\\AppData\\Local\\Programs\\Python\\Python310 和 ...\\Python310\\Scripts', '确认保存后重启命令提示符，输入 pip --version 验证是否修复'] },
  { id: 2, softwareId: 'python', keyword: '中文乱码', title: 'Matplotlib 图表中文显示为方块/乱码', version: 'Python 3.6+', severity: 'medium', solution: ['在绘图代码前添加：import matplotlib.pyplot as plt', "设置中文字体：plt.rcParams['font.sans-serif'] = ['SimHei']", "修复负号显示：plt.rcParams['axes.unicode_minus'] = False", "如果 SimHei 不可用，尝试使用 ['Microsoft YaHei'] 或 ['KaiTi']"] },
  { id: 3, softwareId: 'python', keyword: 'ModuleNotFoundError', title: "ModuleNotFoundError: No module named 'xxx'", version: 'Python 3.6+', severity: 'medium', solution: ['确认是否已安装该模块：pip list 查看已安装包列表', '未安装则执行：pip install 模块名', '如果使用了虚拟环境，确认已激活对应环境', 'Jupyter Notebook 中可使用 !pip install 模块名 直接安装'] },
  { id: 4, softwareId: 'eclipse', keyword: 'Build path错误', title: 'Build path 错误：项目无法编译', version: 'Eclipse 2021+', severity: 'high', solution: ['右键项目 → Properties → Java Build Path → Libraries 选项卡', '检查 JRE System Library 是否有红色叉号，如有则移除后重新添加', '点击 Add Library → JRE System Library → 选择已安装的 JDK', '确认所有外部 JAR 包路径正确，Apply 后刷新项目（F5）'] },
  { id: 5, softwareId: 'eclipse', keyword: '无法找到主类', title: 'Error: Could not find or load main class', version: 'JDK 11+', severity: 'medium', solution: ['检查 main 方法签名是否正确：public static void main(String[] args)', '确认类文件已保存编译，查看 Problems 视图是否有编译错误', '清理项目：Project → Clean，重新编译所有文件', '检查 Run Configuration 中 Main class 设置是否指向正确的类'] },
  { id: 6, softwareId: 'mysql', keyword: '连接拒绝', title: "Can't connect to MySQL server (10061)", version: 'MySQL 8.0', severity: 'high', solution: ['检查 MySQL 服务是否启动：services.msc 中查看 MySQL80 服务状态', '命令行启动服务：net start mysql80', '确认端口 3306 未被占用：netstat -ano | findstr 3306', '检查防火墙设置，允许 3306 端口通信'] },
  { id: 7, softwareId: 'mysql', keyword: 'Access denied', title: "Access denied for user 'root'@'localhost'", version: 'MySQL 8.0', severity: 'medium', solution: ['确认密码输入正确，MySQL 8.0 默认在安装时设置密码', '如果忘记密码，以管理员身份跳过授权表启动 MySQL', "执行 UPDATE mysql.user SET authentication_string=PASSWORD('新密码') WHERE User='root'", '刷新权限 FLUSH PRIVILEGES 后重启服务正常登录'] },
  { id: 8, softwareId: 'matlab', keyword: '内存不足', title: 'Out of memory：MATLAB 内存不足错误', version: 'MATLAB R2020+', severity: 'medium', solution: ['使用 clear 命令清除不需要的变量释放内存', '检查矩阵大小，避免创建过大的临时矩阵', '增加虚拟内存：系统属性 → 高级 → 性能设置 → 虚拟内存', '使用 pack 命令整理内存碎片，或分块处理大数据'] },
  { id: 9, softwareId: 'illustrator', keyword: '扩展外观无法填充', title: 'Illustrator 扩展外观后无法填充颜色', version: 'Adobe CC 2023+', severity: 'medium', solution: ['执行扩展外观后，图形会变为编组路径，需先取消编组（Ctrl+Shift+G）', '使用直接选择工具（白箭头 A）选中目标路径', '检查外观面板中是否有多个填色层，删除多余的填色属性', '重新设置填色颜色，确认色板中选中的是填色而非描边'] },
  { id: 10, softwareId: 'illustrator', keyword: '找不到按钮', title: '不同版本 UI 界面找不到对应按钮', version: 'Adobe CC 2022+', severity: 'low', solution: ['使用顶部搜索栏：帮助 → 查找命令，直接搜索功能名称', '窗口菜单中查找对应面板名称，勾选后面板即显示', 'CC 2024 可使用上下文任务栏快速访问常用功能', '通过 窗口 → 工作区 → 重置基本功能 恢复默认布局'] },
  { id: 11, softwareId: 'autocad', keyword: '快捷键无效', title: 'AutoCAD 快捷键/命令无响应', version: 'AutoCAD 2022+', severity: 'low', solution: ['检查是否在命令行输入状态，点击命令行确保获得焦点', '确认没有正在执行的命令，按 Esc 键取消当前操作', '检查命令别名设置：工具 → 自定义 → 编辑程序参数（acad.pgp）', '重置 AutoCAD 设置：开始菜单 → 重置设置为默认值'] },
  { id: 12, softwareId: 'autocad', keyword: '图纸打印空白', title: '打印后图纸为空白', version: 'AutoCAD 2022+', severity: 'medium', solution: ['检查打印范围设置，确保选中的窗口区域包含所有图形', '确认图层未被关闭或冻结，打印设置中勾选打印所有图层', '检查线宽设置，细线在打印时可能太淡，调整打印线宽', '预览确认图形可见后再执行打印'] },

  // ===== 新增报错方案 =====

  // Python 新增
  { id: 13, softwareId: 'python', keyword: 'SyntaxError', title: 'SyntaxError: invalid syntax 语法错误', version: 'Python 3.6+', severity: 'medium', solution: ['检查代码行是否有遗漏的冒号（if/for/while/def 后必须加 :）', '检查括号是否匹配，字符串引号是否闭合', '检查是否在 Python 2 中使用了 Python 3 语法（如 print 无括号）', '使用 Jupyter 或 IDE 的语法检查功能，红色波浪线标记语法错误位置'] },
  { id: 14, softwareId: 'python', keyword: '内核崩溃', title: 'Jupyter Notebook 内核崩溃/无响应', version: 'Jupyter 6+/7+', severity: 'high', solution: ['点击 Kernel → Restart 重启内核，重新执行代码', '如果反复崩溃，检查是否有无限循环或超大数组导致内存溢出', '清除输出：Kernel → Restart & Clear Output，从干净状态开始', '升级 Jupyter：pip install --upgrade jupyter notebook'] },
  { id: 15, softwareId: 'python', keyword: 'IndentationError', title: 'IndentationError: unexpected indent 缩进错误', version: 'Python 3.6+', severity: 'low', solution: ['Python 使用缩进代替大括号，确保同级别代码缩进一致', '不要混用 Tab 和空格，建议统一使用 4 个空格缩进', '在 Jupyter 中缩进会被自动生成，注意不要额外添加', 'IDE 中可开启显示缩进参考线辅助对齐'] },
  { id: 16, softwareId: 'python', keyword: '编码错误', title: 'UnicodeDecodeError: 文件读取编码错误', version: 'Python 3.6+', severity: 'medium', solution: ['指定编码读取：with open("file.csv", encoding="utf-8") as f', '如果是 GBK 编码文件（常见于中文 Excel 导出），使用 encoding="gbk"', '使用 chardet 库自动检测编码：pip install chardet → chardet.detect(data)', 'CSV 文件推荐用 pandas 读取：pd.read_csv("file", encoding="utf-8")'] },

  // MySQL 新增
  { id: 17, softwareId: 'mysql', keyword: '语法错误1064', title: 'ERROR 1064: You have an error in your SQL syntax', version: 'MySQL 8.0', severity: 'high', solution: ['仔细检查 SQL 语句拼写，确认关键字顺序正确（SELECT → FROM → WHERE → ORDER BY）', '检查是否遗漏引号：字符串值必须用单引号包裹', '确认表名和列名是否正确，MySQL 对大小写敏感（Linux 环境）', '在 Workbench 中使用语法高亮辅助排查，红色标记即为错误位置'] },
  { id: 18, softwareId: 'mysql', keyword: '外键约束', title: 'ERROR 1452: Cannot add or update a foreign key constraint', version: 'MySQL 8.0', severity: 'medium', solution: ['检查外键引用的值在父表中是否存在，先在父表插入数据再在子表插入', '确认外键列和引用列的数据类型完全一致（包括长度和符号）', '临时禁用检查：SET FOREIGN_KEY_CHECKS = 0; 执行操作后再 SET = 1', '检查两个表的引擎是否相同，外键要求均为 InnoDB'] },
  { id: 19, softwareId: 'mysql', keyword: '表已存在', title: 'ERROR 1050: Table already exists 表已存在', version: 'MySQL 8.0', severity: 'low', solution: ['如需重建表：DROP TABLE IF EXISTS 表名; 然后再 CREATE TABLE', '如只需修改表结构：ALTER TABLE 表名 ADD/MODIFY/DROP 列', '查看已有表结构：DESCRIBE 表名 或 SHOW CREATE TABLE 表名', '批量重建：导出数据 → 删表 → 建新表 → 导入数据'] },

  // MATLAB 新增
  { id: 20, softwareId: 'matlab', keyword: '索引越界', title: 'Index exceeds matrix dimensions 紴引越界', version: 'MATLAB R2020+', severity: 'high', solution: ['检查矩阵维度：size(A) 查看 A 的行列数，确认索引在范围内', 'MATLAB 紴引从 1 开始（不是 0），注意与 Python/C 的区别', '使用 end 关键字：A(2:end) 表示从第 2 行到最后', '避免 A(0,...) 或 A(row,col) 中 row/col 超出实际维度'] },
  { id: 21, softwareId: 'matlab', keyword: '变量未定义', title: 'Undefined function or variable 变量未定义', version: 'MATLAB R2020+', severity: 'medium', solution: ['检查变量名是否拼写正确，MATLAB 区分大小写', '确认变量已在前面赋值，清除后需重新定义（clear 会删除所有变量）', '函数文件名必须与函数名一致，且保存在当前路径或搜索路径中', '使用 which 函数名 查找函数位置，确认函数可被调用'] },
  { id: 22, softwareId: 'matlab', keyword: 'Simulink报错', title: 'Simulink 模型无法运行/报错', version: 'MATLAB R2022+', severity: 'medium', solution: ['检查所有模块是否正确连接，无悬空端口或断线', '确认仿真参数设置：Stop time、Step size 是否合理', '查看错误诊断：Simulation → Diagnostics 查看详细错误信息', '检查 Solver 设置：对刚性系统使用 ode15s，非刚性用 ode45'] },

  // Java/Eclipse 新增
  { id: 23, softwareId: 'eclipse', keyword: 'NullPointerException', title: 'NullPointerException 空指针异常', version: 'JDK 11+', severity: 'high', solution: ['检查对象是否为 null 再使用：if (obj != null) { obj.method(); }', '使用调试器定位空指针行：Variables 视图中找到值为 null 的变量', '常见原因：未初始化的对象、返回 null 的方法、数组越界后对象丢失', 'Optional 类避免空指针：Optional.ofNullable(obj).orElse(默认值)'] },
  { id: 24, softwareId: 'eclipse', keyword: 'ClassNotFoundException', title: 'ClassNotFoundException: 类找不到', version: 'JDK 11+', severity: 'medium', solution: ['检查类路径（Classpath）：项目 → Properties → Java Build Path → Libraries', '确认 JAR 包已添加到 Build Path，缺少的用 Add JARs/External JARs 添加', '检查包名和类名是否正确，import 语句是否完整', 'Maven 项目：右键 → Maven → Update Project 刷新依赖'] },
  { id: 25, softwareId: 'eclipse', keyword: '编码乱码', title: 'Eclipse 中文注释/控制台乱码', version: 'Eclipse 2021+', severity: 'low', solution: ['修改工作空间编码：Window → Preferences → General → Workspace → UTF-8', '修改文件编码：右键文件 → Properties → Resource → Text file encoding → UTF-8', '控制台编码：Run Configurations → Common → Encoding → UTF-8', '重新打开文件后乱码通常消失，如仍有问题尝试关闭再重新导入项目'] },

  // PS/AI 新增
  { id: 26, softwareId: 'illustrator', keyword: '保存格式错误', title: 'Photoshop 保存时提示格式不支持或无法保存', version: 'Adobe CC 2023+', severity: 'medium', solution: ['CMYK 模式图片无法保存为 PNG（PNG 仅支持 RGB），先转为 RGB 再保存', '16位/32位色深不能保存为 JPEG/JPG，先转为 8位：图像 → 模式 → 8位/通道', '文件过大无法保存为 PSD（超过 2GB）：使用 PSB（大型文档格式）', '确认存储空间充足，暂时关闭其他程序释放内存'] },
  { id: 27, softwareId: 'illustrator', keyword: '文件损坏', title: 'Illustrator 文件损坏/无法打开', version: 'Adobe CC 2023+', severity: 'high', solution: ['尝试打开最近保存版本：文件 → 打开最近 → 选择之前的自动保存版本', '新建文档 → 文件 → 置入损坏文件，只导入可读取的部分内容', '恢复备份：检查同一文件夹下的 .bak 文件或临时文件', '预防措施：开启自动保存（编辑 → 首选项 → 文件处理 → 自动保存间隔）'] },
  { id: 28, softwareId: 'illustrator', keyword: '性能卡顿', title: 'Photoshop/Illustrator 运行卡顿慢', version: 'Adobe CC 2022+', severity: 'low', solution: ['增加性能内存：编辑 → 首选项 → 性能 → 调高内存使用比例（建议 70-85%）', '设置暂存盘：首选项 → 性能 → 存盘 → 选择空间最大的硬盘作为暂存盘', '减少历史记录状态数：首选项 → 性能 → 历史记录状态 → 降低到 20-30', '关闭不必要的面板和图层，合并不需要再编辑的图层减少文件体积'] },

  // AutoCAD 新增
  { id: 29, softwareId: 'autocad', keyword: '文件损坏', title: 'AutoCAD 文件损坏/打开报错', version: 'AutoCAD 2022+', severity: 'high', solution: ['使用 RECOVER 命令修复：文件 → 图形实用工具 → 修复 → 选择损坏文件', '尝试打开 .sv$ 自动保存文件：工具 → 选项 → 文件 → 自动保存文件位置', '使用 AUDIT 命令检查并修复当前图形中的错误', '预防：定期保存副本，开启自动保存（选项 → 打开和保存 → 自动保存间隔 10分钟）'] },
  { id: 30, softwareId: 'autocad', keyword: '捕捉不准', title: '对象捕捉不准确/无法捕捉到目标点', version: 'AutoCAD 2022+', severity: 'medium', solution: ['输入 OS（OSNAP）检查捕捉设置，勾选需要的捕捉类型（端点/中点/交点等）', '按 F3 开启/关闭对象捕捉，确保捕捉功能已激活', '使用 Shift+右键 弹出捕捉快捷菜单，临时使用特定捕捉类型', '捕捉太近时放大视图（滚轮放大）再选择，避免捕捉到错误点'] },
  { id: 31, softwareId: 'autocad', keyword: '线型不显示', title: '线型显示为实线/不显示虚线等特殊线型', version: 'AutoCAD 2022+', severity: 'low', solution: ['调整线型比例：输入 LTS（LTScale）设置全局线型比例，通常设为 0.5~1', '检查当前线型：输入 LINETYPE 查看可用线型列表并加载需要的线型', '在模型空间和布局空间中线型比例可能不同，分别调整', '确认线型文件（.lin）已加载：格式 → 线型 → 加载'] },
  { id: 32, softwareId: 'autocad', keyword: '文字高度异常', title: '标注或文字高度显示异常/过大过小', version: 'AutoCAD 2022+', severity: 'low', solution: ['检查文字样式：输入 ST（Style）查看当前文字样式和高度设置', '标注文字高度在标注样式中设置：D → 修改 → 文字 → 文字高度', '如果文字高度为 0 则使用输入时指定的高度，设为固定值更稳定', '布局空间文字大小需考虑视口比例：实际高度 = 显示高度 × 视口比例'] }
];

// ===== 数据库结构 =====
function createInitialDB() {
  return {
    software: initialSoftware,
    tutorials: initialTutorials,
    errors: initialErrors,
    submissions: [],
    admins: [
      { id: 1, username: 'admin', password: '$2a$10$XQeJkQPSKQPKQPKQPKQPKuQPKQPKQPKQPKQPKQPKQPKQPKQPKQPKQPK', role: 'admin', createdAt: new Date().toISOString() }
    ],
    stats: {
      pageViews: {},
      searchLogs: []
    },
    meta: {
      nextTutorialId: 43,
      nextErrorId: 33,
      nextSubmissionId: 1,
      nextAdminId: 2
    }
  };
}

// ===== 读取/写入数据库 =====
let dbCache = null;

function loadDB() {
  if (dbCache) return dbCache;
  
  if (fs.existsSync(DB_FILE)) {
    try {
      dbCache = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return dbCache;
    } catch (e) {
      console.error('数据库文件损坏，重新创建:', e.message);
    }
  }
  
  // 文件不存在或损坏，从代码初始化
  dbCache = createInitialDB();
  saveDB();
  return dbCache;
}

function saveDB() {
  if (dbCache) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
    } catch (e) {
      console.warn('数据库写入失败（文件系统可能为只读），数据暂存于内存:', e.message);
    }
  }
}

// ===== 初始化管理员密码（使用 bcrypt） =====
const bcrypt = require('bcryptjs');
function initAdminPassword() {
  const db = loadDB();
  if (db.admins && db.admins[0] && db.admins[0].password.startsWith('$2a$10$XQeJkQ')) {
    // 初始占位密码，替换为真实哈希
    const hash = bcrypt.hashSync('admin123', 10);
    db.admins[0].password = hash;
    saveDB();
    console.log('管理员初始密码已设置: admin / admin123');
  }
}

// ===== 导出数据库操作方法 =====
module.exports = {
  loadDB,
  saveDB,
  initAdminPassword,
  getDB: () => loadDB()
};
