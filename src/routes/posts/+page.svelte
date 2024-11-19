<script lang="ts">
	import type { PageData } from './$types.js';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Image from 'lucide-svelte/icons/image';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { writable } from 'svelte/store';
	import type { Post, Section } from '$lib/types.js';
	import Loader from 'lucide-svelte/icons/loader';

	export let data: PageData;

	let password = '';
	let dialogOpen = false;
	let currentPostType: 'news' | 'services' | 'aboutUs' | 'projects' = 'news';
	let inputSectionImage: HTMLInputElement;
	let inputImage: HTMLInputElement;
	let thumbnailList: Record<string, { url: string; state: string }> = {};
	let showSectionDropdown = false;
	let sections: Section[] = [];
	let isPosting = false;

	const sectionTypes = [
		{ type: 'paragraph', label: 'Đoạn văn' },
		{ type: 'header', label: 'Tiêu đề lớn' },
		{ type: 'subheader', label: 'Tiêu đề nhỏ' },
		{ type: 'bulletList', label: 'Danh sách' },
		{ type: 'image', label: 'Hình ảnh' },
		{ type: 'space', label: 'Khoảng trống' }
	] as const;

	const typePrefix = {
		news: 'VTEN',
		services: 'VTES',
		aboutUs: 'VTEA',
		projects: 'VTEP'
	};

	function createPostSection() {
		const state = writable<Post>({
			id: '',
			title: '',
			type: 'news',
			thumbnail: '',
			sections: [],
			createdAt: 0,
			editedAt: 0
		});

		function deleteTrigger(node: HTMLElement) {
			async function handleClick(e: Event) {
				if (!password) {
					alert('Vui lòng nhập key');
					return;
				}
				e.preventDefault();
				if (!!node.dataset.postid && !!node.dataset.posttype) {
					const postItem = data.postsByType[node.dataset.posttype].find(
						(post) => post.id === node.dataset.postid
					);
					if (postItem) {
						try {
							let existPhotos = [postItem.thumbnail.split('/').pop() || ''];
							if (postItem.sections?.length && postItem.sections.length > 0) {
								for (const section of postItem.sections) {
									if (section.type === 'image') {
										existPhotos.push(section.content[0].split('/').pop() || '');
									}
								}
							}
							const res = await fetch(
								`https://viet_tri_api.mkt-viettri.workers.dev/api/posts/${node.dataset.postid}`,
								{
									method: 'DELETE',
									headers: {
										Authorization: `${password}`
									}
								}
							);
							if (res.ok) {
								await Promise.all(existPhotos.map((key) => deleteImage(key)));
								removePost(node.dataset.postid, node.dataset.posttype);
							} else {
								alert('Sai mật khẩu hoặc Server không hoạt động');
							}
						} catch (error) {
							alert('Có lỗi xảy ra, vui lòng thử lại');
						}
					}
				}
			}
			node.addEventListener('click', handleClick);
			return {
				destroy() {
					node.removeEventListener('click', handleClick);
				}
			};
		}

		function editTrigger(node: HTMLElement) {
			function handleClick(e: Event) {
				e.preventDefault();
				if (!!node.dataset.postid && !!node.dataset.posttype) {
					console.log(node.dataset.postid);
					console.log(node.dataset.posttype);
				}
			}
			node.addEventListener('click', handleClick);
			return {
				destroy() {
					node.removeEventListener('click', handleClick);
				}
			};
		}

		function createPostTrigger(node: HTMLElement) {
			function handleClick(e: Event) {
				if (!password) {
					alert('Vui lòng nhập key');
					return;
				}
				e.preventDefault();
				if (!!node.dataset.posttype && node.dataset.posttype in typePrefix) {
					dialogOpen = true;
					currentPostType = node.dataset.posttype as 'news' | 'services' | 'aboutUs' | 'projects';
				}
			}
			node.addEventListener('click', handleClick);
			return {
				destroy() {
					node.removeEventListener('click', handleClick);
				}
			};
		}

		function removePhotoButton(node: HTMLButtonElement) {
			const handleClick = async (e: Event) => {
				e.preventDefault();
				e.stopPropagation();
				if (!!node.dataset.key) {
					const res = await fetch(
						`https://viet_tri_api.mkt-viettri.workers.dev/api/uploadFile/signedUrl?state=delete&delkey=${node.dataset.key}`,
						{
							method: 'GET'
						}
					);
					const resData = (await res.json()) as any;
					if (resData.ok) {
						if (node.dataset.type === 'thumbnail') {
							//@ts-ignore
							inputImage.value = null;
							thumbnailList[node.dataset.key].state = 'deleting';
							await fetch(resData.delUrl, {
								method: 'DELETE'
							});
							delete thumbnailList[node.dataset.key];
							thumbnailList = { ...thumbnailList };
						} else if (node.dataset.type && node.dataset.type.startsWith('section-')) {
							//@ts-ignore
							inputSectionImage.value = null;
							const index = node.dataset.type.split('-').pop();
							if (index) {
								await fetch(resData.delUrl, {
									method: 'DELETE'
								});
								const indexNumber = parseInt(index);
								sections.splice(indexNumber, 1);
								sections = [...sections];
							}
						}
					} else {
						alert('Có lỗi xảy ra');
					}
				}
			};
			node.addEventListener('click', handleClick);
			return {
				destroy() {
					node.removeEventListener('click', handleClick);
				}
			};
		}

		function clickOutside(node: HTMLElement) {
			const handleClick = (event: MouseEvent) => {
				if (!node.contains(event.target as Node)) {
					node.dispatchEvent(new CustomEvent('clickoutside'));
					showSectionDropdown = false;
				}
			};

			document.addEventListener('click', handleClick, true);

			return {
				destroy() {
					document.removeEventListener('click', handleClick, true);
				}
			};
		}

		function addSection(type: Section['type']) {
			const newSection: Section = {
				type,
				content: type === 'space' ? [] : ['']
			};

			sections = [...sections, newSection];
			showSectionDropdown = false;

			// Focus the new section after render
			if (type === 'image') {
				inputSectionImage.click();
			} else {
				setTimeout(() => {
					const newElement = document.querySelector(
						`[data-section-index="${sections.length - 1}"]`
					);
					if (newElement instanceof HTMLElement) {
						newElement.focus();
					}
				}, 0);
			}
		}

		return {
			element: {
				deleteTrigger,
				editTrigger,
				createPostTrigger,
				removePhotoButton,
				addSection,
				clickOutside
			},
			states: { state }
		};
	}

	const {
		element: {
			deleteTrigger,
			editTrigger,
			createPostTrigger,
			removePhotoButton,
			addSection,
			clickOutside
		},
		states: { state }
	} = createPostSection();

	const removePost = (postId: string, postType: string) => {
		data.postsByType[postType] = data.postsByType[postType].filter((post) => post.id !== postId);
		data.postsByType = { ...data.postsByType };
	};

	const formatPostType = (type: string) => {
		const mapping: Record<string, string> = {
			news: 'Tin tức',
			services: 'Dịch vụ',
			aboutUs: 'Về chúng tôi',
			projects: 'Dự án'
		};
		return mapping[type] || type;
	};

	async function uploadFile(file: File, fileName: string, type: string) {
		const res = await fetch(
			`https://viet_tri_api.mkt-viettri.workers.dev/api/uploadFile/signedUrl?state=geturl&keyname=${fileName}&readExp=${3600 * 24 * 7}`,
			{
				method: 'GET'
			}
		);
		const resData = (await res.json()) as any;
		if (resData.ok) {
			try {
				if (type === 'thumbnail') {
					thumbnailList[fileName] = { url: '', state: 'loading' };
					await fetch(resData.signedUrl, {
						method: 'PUT',
						body: file
					});
					thumbnailList[fileName].state = 'url';
					thumbnailList[fileName].url = resData.objUrl;
				} else if (type === 'section') {
					await fetch(resData.signedUrl, {
						method: 'PUT',
						body: file
					});
					const imageName = `https://pub-4076f91e2c23424590fb9b7fe99e41b5.r2.dev/${fileName}`;
					sections[sections.length - 1].content[0] = imageName;
					sections = [...sections];
				}
			} catch (error) {
				if (type === 'thumbnail') {
					delete thumbnailList[fileName];
					thumbnailList = { ...thumbnailList };
				} else if (type === 'section') {
					delete sections[sections.length - 1];
					sections = [...sections];
				}
			}
		}
	}

	async function handleImageChange(param: string) {
		if (param === 'thumbnail') {
			if (inputImage.files) {
				for (const [key, photo] of Object.entries(inputImage.files)) {
					const fileName = `${crypto.randomUUID()}-${photo.name}`;
					uploadFile(photo, fileName, 'thumbnail');
				}
			}
		}
		if (param === 'section') {
			if (inputSectionImage.files) {
				for (const [key, photo] of Object.entries(inputSectionImage.files)) {
					const fileName = `${crypto.randomUUID()}-${photo.name}`;
					uploadFile(photo, fileName, 'section');
				}
			}
		}
	}

	function addPost(post: Post) {
		data.postsByType[post.type].push(post);
		data.postsByType = { ...data.postsByType };
	}

	async function deleteImage(image: string) {
		const res = await fetch(
			`https://viet_tri_api.mkt-viettri.workers.dev/api/uploadFile/signedUrl?state=delete&delkey=${image}`,
			{
				method: 'GET'
			}
		);
		const resData = (await res.json()) as any;
		if (resData.ok) {
			await fetch(resData.delUrl, {
				method: 'DELETE'
			});
		}
	}

	function resetState() {
		$state = {
			id: '',
			title: '',
			type: 'news',
			thumbnail: '',
			sections: [],
			createdAt: 0,
			editedAt: 0
		};

		dialogOpen = false;
		currentPostType = 'news';
		//@ts-ignore
		inputSectionImage.value = null;
		//@ts-ignore
		inputImage.value = null;
		thumbnailList = {};
		showSectionDropdown = false;
		sections = [];
		isPosting = false;
	}

	async function handleSubmit() {
		if ($state.title && !$state.id) {
			const id = crypto.randomUUID();
			const postId = `${typePrefix[currentPostType]}${id}`;
			$state.id = postId;
		}
		$state.type = currentPostType;
		if (Object.keys(thumbnailList).length > 0) {
			const imageName = Object.keys(thumbnailList)[0];
			const url = `https://pub-4076f91e2c23424590fb9b7fe99e41b5.r2.dev/${imageName}`;
			$state.thumbnail = url;
		}
		$state.sections = sections;
		$state.createdAt = Date.now();
		$state.editedAt = Date.now();
		if (!isPosting) {
			try {
				isPosting = true;
				const body = { ...$state };
				const res = await fetch(`https://viet_tri_api.mkt-viettri.workers.dev/api/posts/create`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `${password}`
					},
					body: JSON.stringify(body)
				});
				if (res.ok) {
					addPost(body);
					resetState();
				} else {
					let existPhotos = [...Object.keys(thumbnailList)];
					if (sections.length > 0) {
						for (const section of sections) {
							if (section.type === 'image') {
								existPhotos.push(section.content[0].split('/').pop() || '');
							}
						}
					}
					if (existPhotos.length > 0) {
						await Promise.all(existPhotos.map((key) => deleteImage(key)));
					}
					resetState();
					alert('Sai mật khẩu hoặc Bài viết đã tồn tại');
				}
			} catch (error) {
				let existPhotos = [...Object.keys(thumbnailList)];
				if (sections.length > 0) {
					for (const section of sections) {
						if (section.type === 'image') {
							existPhotos.push(section.content[0].split('/').pop() || '');
						}
					}
				}
				if (existPhotos.length > 0) {
					await Promise.all(existPhotos.map((key) => deleteImage(key)));
				}
				resetState();
				alert('Có lỗi xảy ra, vui lòng thử lại');
			}
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="flex items-center space-x-2 py-2">
		<span class=" font-medium text-slate-500">Nhập key :</span>
		<input class="rounded-md border px-2 py-1 outline-none" type="password" bind:value={password} />
	</div>
	{#each data.postTypes as postType}
		<section class="mb-12">
			<div class="flex items-start space-x-4">
				<h2 class="mb-6 text-2xl font-bold">{formatPostType(postType)}</h2>
				<div
					use:createPostTrigger
					data-posttype={postType}
					class="flex items-center gap-2 rounded-md bg-blue-500 px-2 py-1 text-white hover:cursor-pointer"
				>
					<CirclePlus class="h-6 w-6" />
					<span class="font-semibold">THÊM BÀI VIẾT</span>
				</div>
			</div>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each data.postsByType[postType] || [] as post (post.id)}
					<div class="relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-md">
						<div class="absolute right-0 top-0 flex items-center gap-1">
							<div
								use:editTrigger
								data-postid={post.id}
								data-posttype={post.type}
								class="rounded-md border bg-white p-1 hover:cursor-pointer hover:bg-slate-200"
							>
								<Pencil class="h-6 w-6 text-slate-600" />
							</div>
							<div
								use:deleteTrigger
								data-postid={post.id}
								data-posttype={post.type}
								class="rounded-md border bg-white p-1 hover:cursor-pointer hover:bg-slate-200"
							>
								<Trash2 class="h-6 w-6 text-slate-600" />
							</div>
						</div>
						<img class="h-48 w-full object-cover" src={post.thumbnail} alt={post.title} />
						<div class="p-4">
							<h3 class="text-lg font-semibold text-slate-700">{post.title}</h3>
							{#if post.sections && post.sections.length > 0}
								{#each post.sections.slice(0, 1) as section}
									{#if section.type === 'paragraph' && section.content}
										<p class="mt-2 line-clamp-3 text-sm text-slate-500">
											{section.content.join(' ')}
										</p>
									{/if}
								{/each}
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}

	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="max-h-screen overflow-y-scroll">
			<Dialog.Header>
				<Dialog.Title>THÊM BÀI VIẾT</Dialog.Title>
				<Dialog.Description />
			</Dialog.Header>
			<form on:submit={async () => await handleSubmit()} action="">
				<div class="flex flex-col gap-2">
					{#if currentPostType === 'services'}
						<div class="flex items-center space-x-2">
							<span class="whitespace-nowrap text-sm font-medium text-slate-500"
								>ID bài viết * :</span
							>
							<input
								type="text"
								bind:value={$state.id}
								placeholder="ID bài viết"
								class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
							/>
						</div>
					{/if}
					<div class="flex items-center space-x-2">
						<span class="whitespace-nowrap text-sm font-medium text-slate-500">Tiêu đề * :</span>
						<input
							type="text"
							bind:value={$state.title}
							placeholder="Tiêu đề bài viết"
							class="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 shadow-sm outline-none"
							required
						/>
					</div>
					<div class="flex items-center space-x-2">
						<span class="text-sm font-medium text-slate-500">Thumbnail * :</span>
						<input
							class="hidden"
							type="file"
							accept="image/*"
							bind:this={inputImage}
							on:change={async () => await handleImageChange('thumbnail')}
						/>
						<input
							class="hidden"
							type="file"
							accept="image/*"
							bind:this={inputSectionImage}
							on:change={async () => await handleImageChange('section')}
						/>
						<button
							class=" flex items-center space-x-2 rounded-md border p-1 hover:bg-slate-200"
							on:click|preventDefault={() => {
								inputImage.click();
							}}
						>
							<Image class="h-[20px] w-[20px] text-green-600" />
							<span class=" text-sm font-medium text-slate-500">Photo</span>
						</button>
					</div>
					<div class="flex flex-wrap gap-2 px-4 py-2">
						{#each Object.entries(thumbnailList) as [key, file]}
							<div class="">
								{#if file.state === 'loading' || file.state === 'deleting'}
									<div class="relative h-[200px] w-[266px] rounded-md bg-slate-100">
										<div
											class=" absolute inset-0 top-0 ml-[50%] flex w-full -translate-x-[50%] items-center justify-center space-x-2"
										>
											<Loader class=" h-6 w-6 animate-spin text-slate-400" />
											<span class=" text-lg font-medium text-slate-400">{file.state}</span>
										</div>
									</div>
								{/if}
								{#if file.state === 'url'}
									<div class="relative h-full">
										<img
											class="aspect-[4/3] h-[200px] rounded-sm border object-contain object-center"
											height={200}
											src={file.url}
											alt={key}
										/>
										<button
											class=" absolute right-0 top-0 z-10 mr-1 mt-1 rounded-md bg-white p-1 hover:bg-slate-200"
											data-key={key}
											data-type="thumbnail"
											use:removePhotoButton
										>
											<Trash2 class="h-6 w-6 text-slate-700" />
										</button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
					<div class="flex items-center justify-between space-x-4">
						<span class="whitespace-nowrap text-sm font-medium text-slate-500"
							>Phân loại bài đăng * :</span
						>
						<select bind:value={currentPostType} class="block h-[32px] w-full rounded-md border">
							<option value="news">Tin tức</option>
							<option value="services">Dịch vụ</option>
							<option value="aboutUs">Về chúng tôi</option>
							<option value="projects">Dự án</option>
						</select>
					</div>
					<span class="whitespace-nowrap font-medium text-slate-500">Nội dung bài viết :</span>
					<div class="relative flex flex-col gap-4 rounded-md bg-slate-100 p-4">
						{#if sections.length > 0}
							{#each sections as section, index (index)}
								<div class="group relative">
									{#if section.type === 'paragraph'}
										<textarea
											data-section-index={index}
											bind:value={section.content[0]}
											class="min-h-[100px] w-full rounded-md border p-3 outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="Nhập nội dung đoạn văn..."
										></textarea>
									{:else if section.type === 'header'}
										<input
											data-section-index={index}
											type="text"
											class="w-full rounded-md border p-3 text-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
											bind:value={section.content[0]}
											placeholder="Nhập tiêu đề lớn..."
										/>
									{:else if section.type === 'subheader'}
										<input
											data-section-index={index}
											type="text"
											class="w-full rounded-md border p-3 text-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
											bind:value={section.content[0]}
											placeholder="Nhập tiêu đề nhỏ..."
										/>
									{:else if section.type === 'bulletList'}
										<div class="flex flex-col gap-2">
											{#each section.content || [''] as item, itemIndex}
												<div class="flex items-center gap-2">
													<span class="text-xl">•</span>
													<input
														data-section-index={index}
														type="text"
														class="flex-1 rounded-md border p-2 outline-none focus:ring-2 focus:ring-blue-500"
														bind:value={item}
														placeholder="Nhập mục danh sách..."
													/>
												</div>
											{/each}
											<button
												class="self-start text-blue-500 hover:text-blue-600"
												on:click|preventDefault={() => {
													if (section.content) {
														section.content = [...section.content, ''];
														sections = sections;
													}
												}}
											>
												+ Thêm mục
											</button>
										</div>
									{:else if section.type === 'space'}
										<div class="h-8"></div>
									{:else if section.type === 'image'}
										<div class="relative w-full">
											<img
												class="object-contain"
												height={100}
												src={section.content[0]}
												alt={section.content[0]}
											/>
											<button
												class=" absolute right-0 top-0 z-10 mr-1 mt-1 rounded-md bg-white p-1 hover:bg-slate-200"
												data-key={section.content[0].split('/').pop()}
												data-type={`section-${index}`}
												use:removePhotoButton
											>
												<Trash2 class="h-6 w-6 text-slate-700" />
											</button>
										</div>
									{/if}

									<!-- Delete button -->
									{#if section.type !== 'image'}
										<button
											class="absolute -left-8 top-2 opacity-0 transition-opacity group-hover:opacity-100"
											on:click={() => {
												sections.splice(index, 1);
												sections = [...sections];
											}}
										>
											<Trash2 class="h-5 w-5 text-red-500 hover:text-red-600" />
										</button>
									{/if}
								</div>
							{/each}
						{/if}

						<!-- Add section button with dropdown -->
						<div class="relative">
							<button
								class="flex items-center gap-2 rounded-md border border-blue-500 px-2 py-1 text-blue-500 hover:bg-blue-50"
								on:click|preventDefault={() => (showSectionDropdown = !showSectionDropdown)}
							>
								<span>Thêm phần</span>
								<ChevronDown class="h-4 w-4" />
							</button>

							{#if showSectionDropdown}
								<div
									class="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border bg-white shadow-lg"
									use:clickOutside
								>
									{#each sectionTypes as { type, label }}
										<button
											class="w-full px-4 py-2 text-left hover:bg-gray-100"
											on:click={() => addSection(type)}
										>
											{label}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
				<div class="mt-2 flex justify-end">
					<button type="submit" class="rounded-md bg-blue-500 px-4 py-2 text-white"
						>Đăng bài viết</button
					>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>
