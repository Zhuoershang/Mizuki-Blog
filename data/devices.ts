// 设备数据配置文件

export interface Device {
	name: string;
	image: string;
	specs: string;
	description: string;
	link: string;
}

// 设备类别类型，支持品牌和自定义类别
export type DeviceCategory = {
	[categoryName: string]: Device[];
} & {
	自定义?: Device[];
};

export const devicesData: DeviceCategory = {
	VIVO: [
		{
			name: "VIVO X90 PRO+",
			image: "/images/device/vivo-x90-pro-plus.png",
			specs: "Black / 16GB + 512GB",
			description: "Flagship smartphone with MediaTek Dimensity 9200+ processor, 50MP quad-camera system with Zeiss optics, 6.78-inch AMOLED display, 4700mAh battery with 80W fast charging.",
			link: "https://www.vivo.com.cn/vivo-x90-pro-plus",
		},
	],
	Router: [
		{
			name: "GL-MT3000",
			image: "/images/device/mt3000.png",
			specs: "1000Mbps / 2.5G",
			description:
				"Portable WiFi 6 router suitable for business trips and home use.",
			link: "https://www.gl-inet.cn/products/gl-mt3000/",
		},
	],
};
